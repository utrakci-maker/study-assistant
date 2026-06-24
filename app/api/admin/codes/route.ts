/**
 * app/api/admin/codes/route.ts
 * GET  /api/admin/codes?password=xxx          — list all unlock codes
 * POST /api/admin/codes                        — create a new unlock code
 *      body: { password, type, code, expiryDays }
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('password') !== ADMIN_PASSWORD) {
    return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('unlock_codes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return NextResponse.json({ codes: data || [] })
}

export async function POST(request: NextRequest) {
  let body: { password?: string; type?: string; code?: string; expiryDays?: number }
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid request.' }, { status: 400 })
  }

  if (body.password !== ADMIN_PASSWORD) {
    return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 })
  }

  const { type, code, expiryDays = 30 } = body

  if (!type || !['single', 'pro_30day'].includes(type)) {
    return NextResponse.json({ message: 'type must be "single" or "pro_30day".' }, { status: 400 })
  }
  if (!code || code.trim().length < 4) {
    return NextResponse.json({ message: 'Code must be at least 4 characters.' }, { status: 400 })
  }

  const normalizedCode = code.trim().toUpperCase()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiryDays)

  const { data, error } = await supabaseAdmin
    .from('unlock_codes')
    .insert({ code: normalizedCode, type, expires_at: expiresAt.toISOString() })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ message: 'That code already exists. Choose a different one.' }, { status: 400 })
    }
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, code: data })
}
