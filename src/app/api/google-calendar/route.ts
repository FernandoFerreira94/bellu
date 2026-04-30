import { NextResponse } from 'next/server'
import { z } from 'zod'

import { handleGoogleWebhook } from '@/lib/google-calendar'

const googleCalendarWebhookRequestSchema = z.object({
  channelId: z.string().min(1, 'Channel ID obrigatório.'),
  resourceId: z.string().min(1, 'Resource ID obrigatório.'),
  resourceState: z.string().min(1, 'Resource state obrigatório.'),
  resourceUri: z.string().url('Resource URI inválida.').optional(),
})

export async function POST(request: Request) {
  const json = await request.json()
  const payload = googleCalendarWebhookRequestSchema.parse(json)
  const data = await handleGoogleWebhook(payload)

  return NextResponse.json({ message: 'Webhook recebido.', data })
}
