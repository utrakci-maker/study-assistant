/**
 * lib/cacheUtils.ts
 *
 * WHY THIS FILE EXISTS:
 * When 50 students all upload a photo of the SAME chapter of the same book,
 * we don't want to call Claude AI 50 separate times — that would cost a lot.
 * Instead, we save the first result and reuse it for everyone else.
 *
 * HOW IT WORKS:
 * 1. After Claude processes an image, we create a "fingerprint" from
 *    the topic title and first part of the summary.
 * 2. Before calling Claude for the next upload, we check if we already
 *    have a result with the same fingerprint.
 * 3. Cache hit = we return the saved result instantly (free!)
 * 4. Cache miss = we call Claude and save the result for future use
 *
 * This can save 70-90% of API costs once you have enough students.
 */

import { supabase } from './supabase'

// ─────────────────────────────────────────────────────────────
// TYPE for a cached result
// ─────────────────────────────────────────────────────────────

export interface CachedContent {
  topic_title: string
  study_plan: string[]
  summary: string
  explanation: string
  quiz: QuizItem[]
  detected_language: string
}

interface QuizItem {
  question: string
  options: string[]
  correct: string
  explanation: string
}

// ─────────────────────────────────────────────────────────────
// FUNCTION 1: Generate a fingerprint from content
// ─────────────────────────────────────────────────────────────

export async function generateFingerprint(
  topicTitle: string,
  summaryStart: string
): Promise<string> {
  // We combine the topic + first 100 chars of summary to make a unique ID
  const combined = `${topicTitle.toLowerCase().trim()}::${summaryStart.toLowerCase().trim().slice(0, 100)}`

  // Use the Web Crypto API (built into Node.js 18+) to make a SHA-256 hash
  const encoder = new TextEncoder()
  const data = encoder.encode(combined)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)

  // Convert the hash bytes to a readable hex string, then take first 20 chars
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return hashHex.slice(0, 20) // Example: "a3f2c8e1b9d4a7f6e2c1"
}

// ─────────────────────────────────────────────────────────────
// FUNCTION 2: Check if we already have this content cached
// ─────────────────────────────────────────────────────────────

export async function checkCache(fingerprint: string): Promise<CachedContent | null> {
  const { data, error } = await supabase
    .from('content_cache')
    .select('topic_title, study_plan, summary, explanation, quiz, detected_language')
    .eq('content_fingerprint', fingerprint)
    .single()

  if (error || !data) {
    return null // Cache miss — we need to call Claude
  }

  // Increment the hit counter so we can track savings
  await supabase
    .from('content_cache')
    .update({ hit_count: (data as any).hit_count + 1 })
    .eq('content_fingerprint', fingerprint)

  return data as CachedContent
}

// ─────────────────────────────────────────────────────────────
// FUNCTION 3: Save a new result to the cache
// ─────────────────────────────────────────────────────────────

export async function saveToCache(
  fingerprint: string,
  content: CachedContent
): Promise<void> {
  const { error } = await supabase
    .from('content_cache')
    .insert({
      content_fingerprint: fingerprint,
      topic_title: content.topic_title,
      study_plan: content.study_plan,
      summary: content.summary,
      explanation: content.explanation,
      quiz: content.quiz,
      detected_language: content.detected_language,
      hit_count: 1,
    })

  if (error) {
    console.error('Cache save error (non-fatal):', error)
    // We don't throw here — a cache save failure shouldn't break the upload
  }
}
