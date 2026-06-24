/**
 * app/api/admin/codes/route.ts
 * GET  /api/admin/codes        — list all unlock codes
 * POST /api/admin/codes        — create a new unlock code
 *
 * Both require: Authorization: Bearer <ADMIN_PASSWORD>
 * Password is in the header, NOT the URL, so it stays out of logs.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme'

function checkAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  return token === ADMIN_PASSWORD
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('unlock_codes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ message: 'Failed to load codes.' }, { status: 500 })
  return NextResponse.json({ codes: data || [] })
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 })
  }

  let body: { type?: string; code?: string; expiryDays?: number }
  try { body = await request.json() } catch {
    return NextResponse.json({ message: 'Invalid request.' }, { status: 400 })
  }

  const { type, code, expiryDays = 30 } = body

  if (!type || !['single', 'pro_30day'].includes(type)) {
    return NextResponse.json({ message: 'type must be "single" or "pro_30day".' }, { status: 400 })
  }
  if (!code || code.trim().length < 4) {
    return NextResponse.json({ message: 'Code must be at least 4 characters.' }, { status: 400 })
  }
  if (typeof expiryDays !== 'number' || expiryDays < 1 || expiryDays > 365) {
    return NextResponse.json({ message: 'expiryDays must be between 1 and 365.' }, { status: 400 })
  }

  const normalizedCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (normalizedCode.length < 4) {
    return NextResponse.json({ message: 'Code must contain at least 4 letters or numbers.' }, { status: 400 })
  }

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
    return NextResponse.json({ message: 'Failed to create code.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, code: data })
}
