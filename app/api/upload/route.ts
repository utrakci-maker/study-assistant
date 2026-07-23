/**
 * app/api/upload/route.ts
 *
 * WHY THIS FILE EXISTS:
 * When a student submits study material on the upload page, the browser sends it here.
 * This route does everything in one go:
 * 1. Validates the input (phone + file)
 * 2. Checks if they're allowed to upload (tier limits)
 * 3. Sends the file to Claude AI for analysis (image/PDF directly; Word/PowerPoint
 *    are text-extracted first since Claude has no native docx/pptx support)
 * 4. Checks the cache (avoids re-processing identical content)
 * 5. Saves the result to the database
 * 6. Returns the submission ID so the browser can go to /results/[id]
 *
 * maxDuration = 300 tells Vercel to allow up to 5 minutes for this route
 * (the current Hobby plan ceiling). Claude Opus can occasionally take over
 * 60s to generate the full 4096-token JSON response, which was silently
 * killing the function mid-request and leaving submissions stuck as 'pending'.
 */

export const maxDuration = 300

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { parseOffice } from 'officeparser'
import { supabaseAdmin } from '@/lib/supabase'
import { checkTierLimits, checkEmailTierLimits, incrementUploadCount, incrementEmailUploadCount } from '@/lib/tiers'
import { generateFingerprint, checkCache, saveToCache } from '@/lib/cacheUtils'
import { STUDY_PROMPT } from '@/lib/prompts'
import { validateEmail, normalizeEmail } from '@/lib/emailUtils'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

// Tier limits (lib/tiers.ts) key off a self-reported phone+email, which costs
// nothing to fake — this is a backstop keyed on IP so scripted abuse can't
// just rotate identities to get unlimited free Claude API calls.
const UPLOAD_RATE_LIMIT = 20
const UPLOAD_RATE_WINDOW_SECONDS = 60 * 60

// Claude reads these image formats and PDFs directly
type ClaudeMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
const ALLOWED_IMAGE_TYPES: ClaudeMediaType[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const PDF_TYPE = 'application/pdf'

// Word/PowerPoint have no native Claude support — text is extracted server-side first
const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const PPTX_TYPE = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
const LEGACY_OFFICE_TYPES = ['application/msword', 'application/vnd.ms-powerpoint']

function extOf(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return dot === -1 ? '' : filename.slice(dot).toLowerCase()
}

// Cap extracted document text so a huge Word/PowerPoint file doesn't blow the token budget
const MAX_EXTRACTED_CHARS = 60_000

export async function POST(request: NextRequest) {

  // ── STEP 0: Rate limit by IP before doing any real work ────────
  const clientIp = getClientIp(request)
  const { allowed, retryAfter } = await rateLimit(`upload:${clientIp}`, UPLOAD_RATE_LIMIT, UPLOAD_RATE_WINDOW_SECONDS)
  if (!allowed) {
    return NextResponse.json(
      { message: 'Too many uploads from this connection. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  // ── STEP 1: Parse the form data sent from the upload page ─────
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ message: 'Invalid form data.' }, { status: 400 })
  }

  const uploadedFile = formData.get('image') as File | null
  if (!uploadedFile || uploadedFile.size === 0) {
    return NextResponse.json({ message: 'A file is required.' }, { status: 400 })
  }
  if (uploadedFile.size > 5 * 1024 * 1024) {
    return NextResponse.json({ message: 'File is too large. Please use a file under 5MB.' }, { status: 400 })
  }

  // ── Detect what kind of file this is (mime type, falling back to extension) ──
  const rawType = uploadedFile.type?.toLowerCase()
  const fileExt = extOf(uploadedFile.name || '')

  const isImage = ALLOWED_IMAGE_TYPES.includes(rawType as ClaudeMediaType) || rawType === 'image/jpg'
  const isPdf = rawType === PDF_TYPE || fileExt === '.pdf'
  const isDocx = rawType === DOCX_TYPE || fileExt === '.docx'
  const isPptx = rawType === PPTX_TYPE || fileExt === '.pptx'
  const isLegacyOffice = LEGACY_OFFICE_TYPES.includes(rawType) || fileExt === '.doc' || fileExt === '.ppt'

  if (isLegacyOffice) {
    return NextResponse.json({
      message: 'Old .doc/.ppt formats are not supported. Please save the file as .docx or .pptx and try again.',
    }, { status: 400 })
  }
  if (!isImage && !isPdf && !isDocx && !isPptx) {
    return NextResponse.json({
      message: 'Unsupported file type. Please upload an image, PDF, Word (.docx), or PowerPoint (.pptx) file.',
    }, { status: 400 })
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

  // ── STEP 3: Read the file and build the content block Claude will see ──
  const fileBuffer = await uploadedFile.arrayBuffer()
  const fileBase64 = Buffer.from(fileBuffer).toString('base64')

  let claudeContent: Anthropic.ImageBlockParam | Anthropic.DocumentBlockParam | Anthropic.TextBlockParam
  let storageContentType: string
  let storageExt: string

  if (isImage) {
    let mediaType: ClaudeMediaType = 'image/jpeg'
    if (ALLOWED_IMAGE_TYPES.includes(rawType as ClaudeMediaType)) {
      mediaType = rawType as ClaudeMediaType
    }
    claudeContent = { type: 'image', source: { type: 'base64', media_type: mediaType, data: fileBase64 } }
    storageContentType = mediaType
    storageExt = mediaType.split('/')[1] || 'jpg'
  } else if (isPdf) {
    claudeContent = { type: 'document', source: { type: 'base64', media_type: PDF_TYPE, data: fileBase64 } }
    storageContentType = PDF_TYPE
    storageExt = 'pdf'
  } else {
    // Word (.docx) / PowerPoint (.pptx) — Claude has no native reader for these,
    // so extract the plain text ourselves and send that instead.
    let extractedText: string
    try {
      // fileType is passed explicitly — magic-byte auto-detection breaks once
      // officeparser is webpack-bundled for the Vercel serverless function.
      const ast = await parseOffice(Buffer.from(fileBuffer), { fileType: isDocx ? 'docx' : 'pptx' })
      extractedText = ast.toText().trim()
    } catch (extractError) {
      console.error('Office file extraction error:', extractError)
      return NextResponse.json({
        message: 'Could not read that file. Please make sure it is a valid, non-corrupted .docx or .pptx file.',
      }, { status: 400 })
    }
    if (!extractedText) {
      return NextResponse.json({
        message: 'That file appears to be empty or contains no readable text.',
      }, { status: 400 })
    }
    claudeContent = { type: 'text', text: extractedText.slice(0, MAX_EXTRACTED_CHARS) }
    storageContentType = isDocx ? DOCX_TYPE : PPTX_TYPE
    storageExt = isDocx ? 'docx' : 'pptx'
  }

  // ── STEP 3b: Upload the original file to Supabase Storage ──────
  // Save a copy so students and admins can refer back to it.
  // Wrapped in try/catch — if the 'study-images' bucket doesn't exist yet,
  // we fall back to 'base64-upload' and still process normally.
  let imageUrl = 'base64-upload'
  try {
    const fileName = `${normalizedPhone}/${Date.now()}.${storageExt}`
    const { data: storageData } = await supabaseAdmin.storage
      .from('study-images')
      .upload(fileName, fileBuffer, { contentType: storageContentType, upsert: false })

    if (storageData) {
      const { data: urlData } = supabaseAdmin.storage
        .from('study-images')
        .getPublicUrl(fileName)
      imageUrl = urlData.publicUrl
    }
  } catch {
    // Bucket not set up yet — continue without storing the file
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

  // ── STEP 5: Call Claude AI with the study material ──────────────
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
      max_tokens: 4096,
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
            claudeContent,
            {
              type: 'text',
              text: 'Please analyze this educational material and return the JSON study material.',
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
      message: 'AI could not process this file. If it is a photo, please use a clearer, well-lit picture. If it is a document, make sure it contains readable text.',
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
