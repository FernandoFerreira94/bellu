export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { sendConfirmationMessage } from '@/lib/bellu-whatsapp'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Retorna a data de amanhã no fuso BRT (UTC-3) no formato YYYY-MM-DD */
function tomorrowBRT(): string {
  const now = new Date()
  // Avança para amanhã em UTC e subtrai 3h para obter o dia correto em BRT
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000)
  return tomorrow.toISOString().slice(0, 10)
}

export async function GET(request: Request) {
  // 1. Autenticação
  const auth = request.headers.get('authorization')
  if (!auth || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = await createSupabaseServerClient()

  // 2. Verifica se Bellu está habilitada
  const { data: profile } = await supabase
    .from('studio_profile')
    .select('luna_confirmation_enabled')
    .single()

  if (!profile?.luna_confirmation_enabled) {
    return NextResponse.json({ sent: 0, skipped: 0, reason: 'luna_confirmation_enabled=false' })
  }

  const tomorrow = tomorrowBRT()

  // 3. Busca bookings de amanhã com cliente que tem telefone
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, client_id, clients!inner(id, phone)')
    .eq('date', tomorrow)
    .in('status', ['pending', 'confirmed'])
    .not('clients.phone', 'is', null)

  if (error) {
    console.error('[cron/confirmations] Erro ao buscar bookings:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  let skipped = 0

  for (const booking of bookings ?? []) {
    try {
      // 4. Verifica duplicata — já existe estado para este booking?
      const { data: existing } = await supabase
        .from('whatsapp_states')
        .select('id')
        .eq('booking_id', booking.id)
        .maybeSingle()

      if (existing) {
        skipped++
        continue
      }

      // 5. Envia
      await sendConfirmationMessage(booking.id)
      sent++

      // 6. Pausa entre envios
      await sleep(2000)
    } catch (err) {
      console.error(`[cron/confirmations] Falha no booking ${booking.id}:`, err)
      skipped++
    }
  }

  return NextResponse.json({ sent, skipped })
}
