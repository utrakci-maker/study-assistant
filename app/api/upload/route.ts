/**
 * app/api/upload/route.ts
 *
 * WHY THIS FILE EXISTS:
 * When a student submits a photo on the upload page, the browser sends it here.
 * This route does everything in one go:
 * 1. Validates the input (phone + image)
 * 2. Checks if they're allowed to upload (tier limits)
 * 3. Sends the image to Claude AI for analysis
 * 4. Checks the cache (avoids re-processing the same content)
 * 5. Saves the result to the database
 * 6. Returns the submission ID so the browser can go to /results/[id]
 *
 * maxDuration = 60 tells Vercel to allow up to 60 seconds for this route.
 * Claude AI can take 15-30 seconds, so we need more than the default 10s.
 */

export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase'
import { checkTierLimits, checkEmailTierLimits, incrementUploadCount, incrementEmailUploadCount } from '@/lib/tiers'
import { generateFingerprint, checkCache, saveToCache } from '@/lib/cacheUtils'
import { STUDY_PROMPT } from '@/lib/prompts'
import { validateEmail, normalizeEmail } from '@/lib/emailUtils'

// Claude only accepts these image formats
type ClaudeMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
const ALLOWED_TYPES: ClaudeMediaType[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export async function POST(request: NextRequest) {

  // ── STEP 1: Parse the form data sent from the upload page ─────
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ message: 'Invalid form data.' }, { status: 400 })
  }

  const imageFile = formData.get('image') as File | null
  if (!imageFile || imageFile.size === 0) {
    return NextResponse.json({ message: 'Image is required.' }, { status: 400 })
  }
  if (imageFile.size > 5 * 1024 * 1024) {
    return NextResponse.json({ message: 'Image is too large. Please use a photo under 5MB.' }, { status: 400 })
  }

  // ── STEP 1b: Resolve identity — auth token or anonymous phone+email ──
  let normalizedPhone: string
  let normalizedEmail: string

  const studentToken = request.headers.get('x-student-token')

  if (studentToken) {
    // Logged-in student path: verify their Supabase session token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(studentToken)
    if (authError || !user?.email) {
      return NextResponse.json({ message: 'Session expired. Please sign in again.' }, { status: 401 })
    }
    const { data: profile } = await supabaseAdmin
      .from('student_profiles')
      .select('phone')
      .eq('id', user.id)
      .single()
    if (!profile) {
      return NextResponse.json({ message: 'Account not yet activated. Please contact your admin.' }, { status: 403 })
    }
    normalizedPhone = profile.phone
    normalizedEmail = user.email.toLowerCase().trim()
  } else {
    // Anonymous path: phone + email must be in the form data
    const phone = (formData.get('phone') as string | null)?.trim()
    const emailRaw = (formData.get('email') as string | null)?.trim()

    if (!phone) {
      return NextResponse.json({ message: 'Phone number is required.' }, { status: 400 })
    }
    if (!emailRaw) {
      return NextResponse.json({ message: 'Email address is required.' }, { status: 400 })
    }
    const emailValidationError = validateEmail(emailRaw)
    if (emailValidationError) {
      return NextResponse.json({ message: emailValidationError }, { status: 400 })
    }

    normalizedPhone = phone.replace(/[\s\-\(\)\.]/g, '')
    if (!/^\+?[0-9]{7,15}$/.test(normalizedPhone)) {
      return NextResponse.json({
        message: 'Please enter a valid phone number (7–15 digits, e.g. 07501234567 or +9647501234567).',
      }, { status: 400 })
    }
    normalizedEmail = normalizeEmail(emailRaw)
  }

  // ── STEP 2: Check tier limits for BOTH phone and email ────────
  // This prevents abuse: changing your phone number won't help if
  // your email is already at the limit (and vice versa).
  const [phoneCheck, emailCheck] = await Promise.all([
    checkTierLimits(normalizedPhone, normalizedEmail),  // also stores email on new records
    checkEmailTierLimits(normalizedEmail),              // checks by user_email column
  ])

  if (!phoneCheck.canUpload) {
    return NextResponse.json({
      status: 'limit_reached',
      message: phoneCheck.reason,
      tier: phoneCheck.tier,
      uploadsToday: phoneCheck.uploadsToday,
      uploadsThisMonth: phoneCheck.uploadsThisMonth,
    }, { status: 429 })
  }

  if (!emailCheck.canUpload) {
    return NextResponse.json({
      status: 'limit_reached',
      message: `Email limit reached: ${emailCheck.reason}`,
      tier: emailCheck.tier,
      uploadsToday: emailCheck.uploadsToday,
      uploadsThisMonth: emailCheck.uploadsThisMonth,
    }, { status: 429 })
  }

  // Use the more restrictive of the two tier levels
  const tierCheck = phoneCheck

  // ── STEP 3: Convert image to base64 for Claude ─────────────────
  // Claude reads the image directly from base64 — no public URL needed
  const imageBuffer = await imageFile.arrayBuffer()
  const imageBase64 = Buffer.from(imageBuffer).toString('base64')

  // Validate and normalize the media type
  let mediaType: ClaudeMediaType = 'image/jpeg'
  const rawType = imageFile.type?.toLowerCase()
  if (ALLOWED_TYPES.includes(rawType as ClaudeMediaType)) {
    mediaType = rawType as ClaudeMediaType
  } else if (rawType === 'image/jpg') {
    mediaType = 'image/jpeg'
  }

  // ── STEP 3b: Upload image to Supabase Storage ─────────────────
  // Save a copy of the image so students and admins can refer back to it.
  // Wrapped in try/catch — if the 'study-images' bucket doesn't exist yet,
  // we fall back to 'base64-upload' and still process normally.
  let imageUrl = 'base64-upload'
  try {
    const ext = mediaType.split('/')[1] || 'jpg'
    const fileName = `${normalizedPhone}/${Date.now()}.${ext}`
    const { data: storageData } = await supabaseAdmin.storage
      .from('study-images')
      .upload(fileName, imageBuffer, { contentType: mediaType, upsert: false })

    if (storageData) {
      const { data: urlData } = supabaseAdmin.storage
        .from('study-images')
        .getPublicUrl(fileName)
      imageUrl = urlData.publicUrl
    }
  } catch {
    // Bucket not set up yet — continue without storing the image
  }

  // ── STEP 4: Create the submission record in the database ───────
  const { data: submission, error: submissionError } = await supabaseAdmin
    .from('submissions')
    .insert({
      user_phone: normalizedPhone,
      user_email: normalizedEmail,
      image_url: imageUrl,
      status: 'pending',
    })
    .select('id')
    .single()

  if (submissionError || !submission) {
    console.error('Submission create error:', submissionError)
    return NextResponse.json({ message: 'Failed to create submission record.' }, { status: 500 })
  }

  const submissionId = submission.id

  // ── STEP 5: Call Claude AI with the image ──────────────────────
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let aiResult: {
    detected_language: string
    topic_title: string
    study_plan: string[]
    summary: string
    explanation: string
    quiz: Array<{ question: string; options: string[]; correct: string; explanation: string }>
  }

  let inputTokens = 0
  let outputTokens = 0
  let costUsd = 0

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 2048,
      system: [
        {
          type: 'text',
          text: STUDY_PROMPT,
          cache_control: { type: 'ephemeral' }, // Caches the prompt → saves ~90% on repeated calls
        },
      ],
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            {
              type: 'text',
              text: 'Please analyze this educational image and return the JSON study material.',
            },
          ],
        },
      ],
    })

    inputTokens = response.usage.input_tokens
    outputTokens = response.usage.output_tokens
    // Claude Opus 4.8 pricing: $5 per 1M input tokens, $25 per 1M output tokens
    costUsd = (inputTokens / 1_000_000) * 5 + (outputTokens / 1_000_000) * 25

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    // Strip any markdown code fences Claude might wrap around the JSON
    const cleanedJson = rawText.replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/```\s*$/m, '').trim()
    aiResult = JSON.parse(cleanedJson)

  } catch (aiError) {
    const errorMessage = aiError instanceof Error ? aiError.message : 'Unknown AI error'
    console.error('Claude error:', errorMessage)

    await Promise.all([
      supabaseAdmin.from('submissions').update({ status: 'failed' }).eq('id', submissionId),
      supabaseAdmin.from('api_logs').insert({
        user_phone: normalizedPhone,
        submission_id: submissionId,
        event: 'error',
        model_used: 'claude-opus-4-8',
        tokens_input: 0,
        tokens_output: 0,
        cost_usd: 0,
        error_message: errorMessage,
      }),
    ])

    return NextResponse.json({
      message: 'AI could not process the image. Please use a clearer, well-lit photo of your study material.',
    }, { status: 500 })
  }

  // ── STEP 6: Check the cache to avoid duplicate processing ──────
  const fingerprint = await generateFingerprint(aiResult.topic_title, aiResult.summary)
  const cached = await checkCache(fingerprint)
  const wasCached = !!cached
  const finalResult = cached || aiResult

  // Log what happened
  await supabaseAdmin.from('api_logs').insert({
    user_phone: normalizedPhone,
    submission_id: submissionId,
    event: wasCached ? 'cache_hit' : 'api_call',
    model_used: 'claude-opus-4-5',
    tokens_input: wasCached ? 0 : inputTokens,
    tokens_output: wasCached ? 0 : outputTokens,
    cost_usd: wasCached ? 0 : costUsd,
  })

  if (!wasCached) {
    await saveToCache(fingerprint, aiResult)
  }

  // ── STEP 7: Save the final result to the submission record ─────
  await supabaseAdmin.from('submissions').update({
    detected_language: finalResult.detected_language,
    topic_title: finalResult.topic_title,
    study_plan: finalResult.study_plan,
    summary: finalResult.summary,
    explanation: finalResult.explanation,
    quiz: finalResult.quiz,
    status: 'processed',
    tier_used: tierCheck.tier,
    cost_usd: wasCached ? 0 : costUsd,
  }).eq('id', submissionId)

  // ── STEP 8: Increment upload count for both phone and email ───
  await Promise.all([
    incrementUploadCount(normalizedPhone),
    incrementEmailUploadCount(normalizedEmail),
  ])

  // ── STEP 9: Return the submission ID to the browser ───────────
  // The upload page will redirect to /results/[submissionId]
  return NextResponse.json({ status: 'success', submissionId, wasCached })
}
