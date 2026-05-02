// src/lib/google-token.ts
import { createSupabaseServerClient } from '@/lib/supabase-server'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

export async function getGoogleTokens(): Promise<{
  access_token: string
  refresh_token: string | null
  expires_at: string | null
} | null> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('google_tokens')
    .select('access_token, refresh_token, expires_at')
    .maybeSingle()
  return data ?? null
}

export async function saveGoogleTokens(params: {
  access_token: string
  refresh_token: string | null
  expires_in: number
}): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const expires_at = new Date(Date.now() + params.expires_in * 1000).toISOString()

  await supabase
    .from('google_tokens')
    .upsert(
      {
        user_id: user.id,
        access_token: params.access_token,
        refresh_token: params.refresh_token,
        expires_at,
      },
      { onConflict: 'user_id' },
    )
}

export async function deleteGoogleTokens(): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('google_tokens').delete().eq('user_id', user.id)
}

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await getGoogleTokens()
  if (!tokens) return null

  const expiresAt = tokens.expires_at ? new Date(tokens.expires_at) : null
  const isExpired = expiresAt
    ? expiresAt.getTime() - Date.now() < 5 * 60 * 1000
    : false

  if (!isExpired) return tokens.access_token
  if (!tokens.refresh_token) return null

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  })

  if (!res.ok) return null

  const data = await res.json()
  await saveGoogleTokens({
    access_token: data.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: data.expires_in,
  })

  return data.access_token
}
