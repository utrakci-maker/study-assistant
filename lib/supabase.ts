/**
 * lib/supabase.ts
 *
 * WHY THIS FILE EXISTS:
 * Your app needs to talk to Supabase (the cloud database) to save
 * student submissions, check usage limits, and cache AI results.
 * This file creates ONE shared connection so every other file
 * can use it without creating duplicate connections.
 *
 * Think of this like the "phone line" to your database.
 * Every file that needs the database imports `supabase` from here.
 */

import { createClient } from '@supabase/supabase-js'

// Fall back to placeholder strings so the build succeeds even before
// Supabase credentials are added. Real requests will fail gracefully
// with a Supabase auth error rather than crashing the entire build.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
