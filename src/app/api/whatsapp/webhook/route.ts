export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { processIncomingMessage } from '@/lib/luna-whatsapp'

const bodySchema = z.object({
  from: z.string(),
  message: z.string(),
  timestamp: z.number().optional(),
})

export async function POST(request: Request) {
  // 1. Validação do secret
  const secret = request.headers.get('x-webhook-secret')
  if (!secret || secret !== process.env.WHATSAPP_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // 2. Parse do body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    )
  }

  // 3. Processa mensagem
  try {
    await processIncomingMessage(parsed.data.from, parsed.data.message)
  } catch (err) {
    console.error('[webhook] processIncomingMessage falhou:', err)
    return NextResponse.json(
      { error: (err as Error).message ?? 'Erro interno' },
      { status: 500 },
    )
  }

  // 4. OK
  return NextResponse.json({ ok: true })
}
