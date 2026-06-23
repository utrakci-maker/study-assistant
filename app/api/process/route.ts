/**
 * app/api/process/route.ts
 *
 * WHY THIS FILE EXISTS:
 * This is the HEART of your entire app — the server-side function that:
 * 1. Receives an uploaded image submission ID
 * 2. Checks if the student is allowed to use the app (tier limits)
 * 3. Calls Claude AI to analyze the image
 * 4. Saves the result to the database
 * 5. Returns the study material to the student
 *
 * "API route" means: this is a URL your app calls on its own server.
 * Students never see this URL directly — it runs invisibly in the background.
 * URL: POST /api/process
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabase } from '@/lib/supabase'
import { checkTierLimits, incrementUploadCount } from '@/lib/tiers'
import { generateFingerprint, checkCache, saveToCache, type QuizItem } from '@/lib/cacheUtils'
import { STUDY_PROMPT } from '@/lib/prompts'

// ─────────────────────────────────────────────────────────────
// POST /api/process
// Body: { submissionId: string, userPhone: string }
// ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ── STEP 1: Parse the incoming request ────────────────────
  let body: { submissionId?: string; userPhone?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Invalid request body — expected JSON.' },
      { status: 400 }
    )
  }

  const { submissionId, userPhone } = body

  if (!submissionId || !userPhone) {
    return NextResponse.json(
      { status: 'error', message: 'Missing submissionId or userPhone.' },
      { status: 400 }
    )
  }

  // ── STEP 2: Check if this student is allowed to upload ────
  const tierCheck = await checkTierLimits(userPhone)

  if (!tierCheck.canUpload) {
    return NextResponse.json(
      {
        status: 'limit_reached',
        message: tierCheck.reason,
        tier: tierCheck.tier,
        uploadsToday: tierCheck.uploadsToday,
        uploadsThisMonth: tierCheck.uploadsThisMonth,
      },
      { status: 429 } // 429 = "Too Many Requests"
    )
  }

  // ── STEP 3: Load the submission from the database ─────────
  const { data: submission, error: loadError } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', submissionId)
    .single()

  if (loadError || !submission) {
    return NextResponse.json(
      { status: 'error', message: 'Submission not found.' },
      { status: 404 }
    )
  }

  // ── STEP 4: Initialize the Anthropic (Claude) client ──────
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  // ── STEP 5: Call Claude AI with the image ─────────────────
  let aiResult: {
    detected_language: string
    topic_title: string
    study_plan: string[]
    summary: string
    explanation: string
    quiz: QuizItem[]
  }

  let inputTokens = 0
  let outputTokens = 0
  let wasCached = false
  let costUsd = 0

  try {
    // Build the image message for Claude
    // We pass the public URL of the image so Claude can "see" it
    const imageUrl = submission.image_url

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      system: [
        {
          type: 'text',
          text: STUDY_PROMPT,
          // Prompt caching: Claude caches this system prompt so repeated calls
          // with the same prompt cost ~90% less. This is a huge cost saver.
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'url',
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: 'Please analyze this educational image and return the JSON study material.',
            },
          ],
        },
      ],
    })

    // Extract token usage for cost tracking
    inputTokens = response.usage.input_tokens
    outputTokens = response.usage.output_tokens

    // Calculate cost (Claude Opus pricing: $15 per 1M input, $75 per 1M output)
    costUsd = (inputTokens / 1_000_000) * 15 + (outputTokens / 1_000_000) * 75

    // Parse the JSON response from Claude
    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

    // Claude returns JSON — we parse it here
    // Strip any markdown code blocks Claude might wrap around it
    const cleanedJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    aiResult = JSON.parse(cleanedJson)

  } catch (aiError) {
    const errorMessage = aiError instanceof Error ? aiError.message : 'Unknown AI error'
    console.error('Claude API error:', errorMessage)

    // Log the failure to api_logs
    await supabase.from('api_logs').insert({
      user_phone: userPhone,
      submission_id: submissionId,
      event: 'error',
      model_used: 'claude-opus-4-5',
      tokens_input: 0,
      tokens_output: 0,
      cost_usd: 0,
      error_message: errorMessage,
    })

    // Update submission status to 'failed'
    await supabase
      .from('submissions')
      .update({ status: 'failed' })
      .eq('id', submissionId)

    return NextResponse.json(
      {
        status: 'error',
        message: 'AI processing failed. Please try again or use a clearer image.',
      },
      { status: 500 }
    )
  }

  // ── STEP 6: Generate fingerprint for cache lookup ─────────
  const fingerprint = await generateFingerprint(
    aiResult.topic_title,
    aiResult.summary
  )

  // Check if we already have this content cached
  const cached = await checkCache(fingerprint)

  if (cached) {
    // CACHE HIT — use the cached result, save money!
    wasCached = true
    costUsd = 0 // No API cost for cache hits

    await supabase.from('api_logs').insert({
      user_phone: userPhone,
      submission_id: submissionId,
      event: 'cache_hit',
      model_used: 'claude-opus-4-5',
      tokens_input: 0,
      tokens_output: 0,
      cost_usd: 0,
    })

    // Update submission with cached data
    await supabase
      .from('submissions')
      .update({
        detected_language: cached.detected_language,
        topic_title: cached.topic_title,
        study_plan: cached.study_plan,
        summary: cached.summary,
        explanation: cached.explanation,
        quiz: cached.quiz,
        status: 'processed',
        tier_used: tierCheck.tier,
        cost_usd: 0,
      })
      .eq('id', submissionId)

  } else {
    // CACHE MISS — save new result to both tables
    await saveToCache(fingerprint, {
      topic_title: aiResult.topic_title,
      study_plan: aiResult.study_plan,
      summary: aiResult.summary,
      explanation: aiResult.explanation,
      quiz: aiResult.quiz,
      detected_language: aiResult.detected_language,
    })

    // Save to the submission record
    await supabase
      .from('submissions')
      .update({
        detected_language: aiResult.detected_language,
        topic_title: aiResult.topic_title,
        study_plan: aiResult.study_plan,
        summary: aiResult.summary,
        explanation: aiResult.explanation,
        quiz: aiResult.quiz,
        status: 'processed',
        tier_used: tierCheck.tier,
        cost_usd: costUsd,
      })
      .eq('id', submissionId)

    // Log the API call
    await supabase.from('api_logs').insert({
      user_phone: userPhone,
      submission_id: submissionId,
      event: 'api_call',
      model_used: 'claude-opus-4-5',
      tokens_input: inputTokens,
      tokens_output: outputTokens,
      cost_usd: costUsd,
    })
  }

  // ── STEP 7: Increment the student's upload count ──────────
  await incrementUploadCount(userPhone)

  // ── STEP 8: Return success response ───────────────────────
  const resultData = cached || aiResult
  return NextResponse.json({
    status: 'success',
    wasCached,
    data: {
      submissionId,
      detectedLanguage: resultData.detected_language,
      topicTitle: resultData.topic_title,
      studyPlan: resultData.study_plan,
      summary: resultData.summary,
      explanation: resultData.explanation,
      quiz: resultData.quiz,
    },
  })
}
