// src/app/auth/google-calendar/callback/route.ts
import { NextResponse } from 'next/server'
import { saveGoogleTokens } from '@/lib/google-token'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${origin}/dashboard/settings?gcal=error`)
  }

  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_CALENDAR_REDIRECT_URI!,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${origin}/dashboard/settings?gcal=error`)
  }

  const tokens = await tokenRes.json()
  await saveGoogleTokens({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expires_in: tokens.expires_in,
  })

  // Triggar importação inicial em background (fire and forget)
  fetch(`${origin}/api/google-calendar/import`, {
    method: 'POST',
    headers: { 'x-import-secret': process.env.CRON_SECRET! },
  }).catch(() => {})

  return NextResponse.redirect(`${origin}/dashboard/settings?gcal=connected`)
}
