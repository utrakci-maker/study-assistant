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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// We check these exist so you get a clear error message instead of a mystery crash
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Please fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
