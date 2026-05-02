// src/app/api/cron/gcal-webhook-renew/route.ts
import { NextResponse } from 'next/server'
import { registerGCalWebhook } from '@/lib/google-calendar-api'
import { getValidAccessToken } from '@/lib/google-token'
import { randomUUID } from 'crypto'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const token = await getValidAccessToken()
  if (!token) return NextResponse.json({ skipped: 'no token' })

  const channelId = randomUUID()
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/google-calendar/webhook`

  try {
    const result = await registerGCalWebhook({ channelId, callbackUrl })
    if (!result) return NextResponse.json({ error: 'failed to register webhook' }, { status: 500 })

    return NextResponse.json({ ok: true, expiration: result.expiration })
  } catch (err) {
    console.error('[GCal Webhook Renew] Erro:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
