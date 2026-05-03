// src/app/api/google-calendar/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { saveGoogleTokens } from '@/lib/google-token'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (error) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?gcal=error&reason=${error}`)
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?gcal=error&reason=no_code`)
  }

  // Validar state
  const cookieState = request.cookies.get('gcal_oauth_state')?.value
  if (!cookieState || cookieState !== state) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings?gcal=error&reason=invalid_state`)
  }

  // Trocar code por tokens
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.GOOGLE_CALENDAR_REDIRECT_URI!,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  })

  if (!res.ok) {
    console.error('[GCal Callback] Token exchange falhou:', res.status, await res.text())
    return NextResponse.redirect(`${appUrl}/dashboard/settings?gcal=error&reason=token_exchange`)
  }

  const data = await res.json()

  await saveGoogleTokens({
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? null,
    expires_in: data.expires_in,
  })

  const response = NextResponse.redirect(`${appUrl}/dashboard?gcal=connected`)

  // Limpar cookie de state
  response.cookies.set('gcal_oauth_state', '', { maxAge: 0, path: '/' })

  return response
}
