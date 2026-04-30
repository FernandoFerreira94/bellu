import { NextResponse } from 'next/server'
import { z } from 'zod'

import { createWhatsAppSession, sendWhatsAppMessage } from '@/lib/baileys'

const whatsappRequestSchema = z.object({
  action: z.enum(['session', 'send']),
  phone: z.string().min(8, 'Telefone inválido.').optional(),
  message: z.string().min(1, 'Mensagem obrigatória.').optional(),
})

export async function POST(request: Request) {
  const json = await request.json()
  const payload = whatsappRequestSchema.parse(json)

  if (payload.action === 'session') {
    const session = await createWhatsAppSession()

    return NextResponse.json({ message: 'Sessão inicializada.', data: session })
  }

  const result = await sendWhatsAppMessage({
    phone: payload.phone ?? '',
    message: payload.message ?? '',
  })

  return NextResponse.json({ message: 'Mensagem processada.', data: result })
}
