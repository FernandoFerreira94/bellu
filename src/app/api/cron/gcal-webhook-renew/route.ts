// src/app/api/cron/gcal-webhook-renew/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { registerGCalWebhook } from '@/lib/google-calendar-api'
import { getValidAccessToken } from '@/lib/google-token'
import { randomUUID } from 'crypto'

const GCAL_BASE = 'https://www.googleapis.com/calendar/v3'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const token = await getValidAccessToken()
  if (!token) return NextResponse.json({ skipped: 'no token' })

  const supabase = await createSupabaseServerClient()

  // Buscar canal atual para parar antes de registrar novo
  const { data: tokenRow } = await supabase
    .from('google_tokens')
    .select('user_id')
    .maybeSingle()

  if (!tokenRow) return NextResponse.json({ skipped: 'no user' })

  const { data: profile } = await supabase
    .from('studio_profile')
    .select('gcal_channel_id, gcal_resource_id')
    .eq('id', tokenRow.user_id)
    .single()

  // Parar canal antigo silenciosamente usando resourceId correto
  if (profile?.gcal_channel_id && profile?.gcal_resource_id) {
    try {
      await fetch(`${GCAL_BASE}/channels/stop`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: profile.gcal_channel_id,
          resourceId: profile.gcal_resource_id,
        }),
      })
    } catch {
      // ignorar — canal pode já ter expirado
    }
  }

  const channelId = randomUUID()
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/google-calendar/webhook`

  try {
    const result = await registerGCalWebhook({ channelId, callbackUrl })
    if (!result) return NextResponse.json({ error: 'failed to register webhook' }, { status: 500 })

    // Persistir novo channelId, resourceId e expiração
    await supabase
      .from('studio_profile')
      .update({
        gcal_channel_id: channelId,
        gcal_resource_id: result.resourceId,
        gcal_channel_expiration: result.expiration,
      })
      .eq('id', tokenRow.user_id)

    return NextResponse.json({ ok: true, expiration: result.expiration })
  } catch (err) {
    console.error('[GCal Webhook Renew] Erro:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
