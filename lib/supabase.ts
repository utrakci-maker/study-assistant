/**
 * lib/supabase.ts
 *
 * TWO database clients live here:
 *
 * 1. `supabase` — uses the public anon key. Safe to use in the browser.
 *    RLS policies control what it can access.
 *
 * 2. `supabaseAdmin` — uses the secret service role key. SERVER ONLY.
 *    Bypasses RLS and has full database access. Never expose this to the browser.
 *    All our API routes use this one.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

// Public client — limited access, safe for browser use
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client — full access, SERVER SIDE ONLY
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
