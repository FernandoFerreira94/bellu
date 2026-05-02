import { createSupabaseServerClient } from '@/lib/supabase-server'
import { sendWhatsAppMessage } from '@/lib/baileys'

// ── Helpers ────────────────────────────────────────────────────────────────

function normalize(text: string) {
  return text.trim().toLowerCase()
}

/** Verifica se o horário atual (BRT = UTC-3) está entre 08:00 e 18:00 */
function isWithinSendWindow(): boolean {
  const brt = new Date(Date.now() - 3 * 60 * 60 * 1000)
  const hour = brt.getUTCHours()
  return hour >= 8 && hour < 18
}

async function send(phone: string, text: string): Promise<void> {
  if (!isWithinSendWindow()) {
    // Fora do horário — não envia, apenas loga (a mensagem já foi salva no BD pelo chamador)
    console.warn(`[Bellu] Fora da janela de envio. Mensagem para ${phone} não enviada.`)
    return
  }
  await sendWhatsAppMessage({ phone, message: text })
}

// ── Registro de mensagens ──────────────────────────────────────────────────

type MessageRecord = {
  booking_id?: string | null
  client_id?: string | null
  phone: string
  topic: string
  content: string
  extension?: string
  direction: 'inbound' | 'outbound'
  status?: string
  event?: string | null
  payload?: object | null
}

async function saveMessage(record: MessageRecord) {
  const supabase = await createSupabaseServerClient()
  await supabase.from('messages').insert({
    booking_id: record.booking_id ?? null,
    client_id: record.client_id ?? null,
    phone: record.phone,
    topic: record.topic,
    content: record.content,
    extension: record.extension ?? 'whatsapp',
    direction: record.direction,
    status: record.status ?? 'sent',
    event: record.event ?? null,
    payload: record.payload ?? null,
  })
}

// ── Formatação de data/hora ────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function formatTime(timeStr: string) {
  return timeStr.slice(0, 5) // "HH:MM"
}

// ── FLOW 1 — Enviar confirmação (sistema → cliente) ────────────────────────

export async function sendConfirmationMessage(bookingId: string): Promise<void> {
  const supabase = await createSupabaseServerClient()

  // Busca booking com joins
  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .select('id, date, start_time, status, client_id, procedure_id, clients(id, name, phone), procedures(id, name, duration)')
    .eq('id', bookingId)
    .single()

  if (bErr || !booking) throw new Error(`Booking não encontrado: ${bookingId}`)

  const client = (booking.clients as unknown as { id: string; name: string; phone: string } | null)
  const procedure = (booking.procedures as unknown as { id: string; name: string } | null)

  if (!client?.phone) throw new Error('Cliente sem telefone')
  if (!procedure) throw new Error('Procedimento não encontrado')

  const text =
    `Olá ${client.name}! 😊 Confirmando seu horário de *${procedure.name}* ` +
    `amanhã às *${formatTime(booking.start_time)}*. ` +
    `Responda *SIM* para confirmar ou *NÃO* caso precise cancelar.`

  // Upsert estado da conversa
  await supabase.from('whatsapp_states').upsert(
    {
      phone: client.phone,
      flow: 'confirmation',
      state: 'awaiting_client',
      booking_id: bookingId,
      client_id: client.id,
      payload: { procedure_name: procedure.name, date: booking.date, start_time: booking.start_time },
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    { onConflict: 'phone' },
  )

  await send(client.phone, text)

  await saveMessage({
    booking_id: bookingId,
    client_id: client.id,
    phone: client.phone,
    topic: 'confirmation',
    content: text,
    direction: 'outbound',
    event: 'confirmation_sent',
  })
}

// ── FLOW 2 — Resposta do cliente à confirmação ────────────────────────────

async function handleClientConfirmationReply(
  state: Record<string, unknown>,
  fromPhone: string,
  msg: string,
) {
  const supabase = await createSupabaseServerClient()
  const bookingId = state.booking_id as string
  const clientId = state.client_id as string
  const payload = (state.payload as Record<string, string>) ?? {}

  const norm = normalize(msg)

  // Salva mensagem inbound
  await saveMessage({
    booking_id: bookingId,
    client_id: clientId,
    phone: fromPhone,
    topic: 'confirmation',
    content: msg,
    direction: 'inbound',
    event: 'client_reply',
  })

  // SIM
  if (['sim', 'yes', 's', '1', 'confirmar', 'confirmado'].includes(norm)) {
    await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId)

    const reply = 'Perfeito! Te esperamos amanhã ✨'
    await send(fromPhone, reply)
    await saveMessage({ booking_id: bookingId, client_id: clientId, phone: fromPhone, topic: 'confirmation', content: reply, direction: 'outbound', event: 'confirmed' })

    await supabase.from('whatsapp_states').delete().eq('phone', fromPhone)
    return
  }

  // NÃO / cancelar
  if (['não', 'nao', 'no', 'n', 'cancelar', 'cancela'].includes(norm)) {
    await notifyProfessionalAboutCancellation(state, fromPhone, payload, clientId, bookingId)
    return
  }

  // Reagendamento detectado na resposta
  const rescheduleWords = ['remarcar', 'reagendar', 'mudar', 'alterar', 'remarco', 'mudar horário']
  if (rescheduleWords.some((w) => norm.includes(w))) {
    await notifyProfessionalAboutReschedule(state, fromPhone, payload, clientId, bookingId)
    return
  }

  // Não entendeu
  const fallback = 'Não entendi 😅 Responda *SIM* para confirmar ou *NÃO* para cancelar.'
  await send(fromPhone, fallback)
  await saveMessage({ booking_id: bookingId, client_id: clientId, phone: fromPhone, topic: 'confirmation', content: fallback, direction: 'outbound', event: 'fallback' })
}

// ── FLOW 3 — Notificar profissional sobre cancelamento ────────────────────

async function notifyProfessionalAboutCancellation(
  state: Record<string, unknown>,
  clientPhone: string,
  payload: Record<string, string>,
  clientId: string,
  bookingId: string,
) {
  const supabase = await createSupabaseServerClient()

  // Busca nome do cliente e número da profissional
  const [{ data: clientData }, { data: profile }] = await Promise.all([
    supabase.from('clients').select('name').eq('id', clientId).single(),
    supabase.from('studio_profile').select('phone, owner_name').single(),
  ])

  const clientName = clientData?.name ?? 'sua cliente'
  const professionalPhone = profile?.phone
  if (!professionalPhone) throw new Error('Profissional sem telefone configurado')

  const text =
    `Bellu aqui 🤖 Sua cliente *${clientName}* quer cancelar o horário de ` +
    `*${formatDate(payload.date)}* às *${formatTime(payload.start_time)}*. ` +
    `Responda *AUTORIZAR* para eu cancelar ou *EU RESOLVO* para falar com ela diretamente.`

  // Atualiza estado para aguardar profissional
  await supabase
    .from('whatsapp_states')
    .update({
      state: 'awaiting_professional',
      payload: {
        ...payload,
        client_name: clientName,
        client_phone: clientPhone,
        client_id: clientId,
        booking_id: bookingId,
        action: 'cancel',
      },
    })
    .eq('phone', clientPhone)

  await send(professionalPhone, text)

  await saveMessage({
    booking_id: bookingId,
    client_id: clientId,
    phone: professionalPhone,
    topic: 'confirmation',
    content: text,
    direction: 'outbound',
    event: 'professional_notified_cancel',
  })
}

// ── FLOW 4 — Notificar profissional sobre reagendamento ───────────────────

async function notifyProfessionalAboutReschedule(
  state: Record<string, unknown>,
  clientPhone: string,
  payload: Record<string, string>,
  clientId: string,
  bookingId: string,
) {
  const supabase = await createSupabaseServerClient()

  const [{ data: clientData }, { data: profile }] = await Promise.all([
    supabase.from('clients').select('name').eq('id', clientId).single(),
    supabase.from('studio_profile').select('phone, owner_name').single(),
  ])

  const clientName = clientData?.name ?? 'sua cliente'
  const professionalPhone = profile?.phone
  if (!professionalPhone) throw new Error('Profissional sem telefone configurado')

  const text =
    `Bellu aqui 🤖 Sua cliente *${clientName}* quer *remarcar* o horário de ` +
    `*${formatDate(payload.date)}* às *${formatTime(payload.start_time)}*. ` +
    `Responda *AUTORIZAR* para eu liberar o horário atual e remarcarmos ou *EU RESOLVO* para falar com ela diretamente.`

  await supabase
    .from('whatsapp_states')
    .update({
      state: 'awaiting_professional',
      payload: {
        ...payload,
        client_name: clientName,
        client_phone: clientPhone,
        client_id: clientId,
        booking_id: bookingId,
        action: 'reschedule',
      },
    })
    .eq('phone', clientPhone)

  await send(professionalPhone, text)

  await saveMessage({
    booking_id: bookingId,
    client_id: clientId,
    phone: professionalPhone,
    topic: 'reschedule',
    content: text,
    direction: 'outbound',
    event: 'professional_notified_reschedule',
  })
}

// ── FLOW 3 — Resposta da profissional ────────────────────────────────────

async function handleProfessionalReply(
  stateRow: Record<string, unknown>,
  fromPhone: string,
  msg: string,
) {
  const supabase = await createSupabaseServerClient()
  const payload = (stateRow.payload as Record<string, string>) ?? {}
  const clientPhone = payload.client_phone
  const clientId = payload.client_id
  const bookingId = payload.booking_id
  const clientName = payload.client_name ?? 'você'

  const { data: profile } = await supabase
    .from('studio_profile')
    .select('owner_name')
    .single()

  const ownerName = profile?.owner_name ?? 'a profissional'
  const norm = normalize(msg)

  // Salva inbound
  await saveMessage({
    booking_id: bookingId,
    client_id: clientId,
    phone: fromPhone,
    topic: 'confirmation',
    content: msg,
    direction: 'inbound',
    event: 'professional_reply',
  })

  if (norm.includes('autorizar')) {
    // Cancela booking
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)

    // Notifica cliente
    const clientMsg = 'Tudo certo! Seu horário foi cancelado. Qualquer coisa, é só chamar 😊'
    await send(clientPhone, clientMsg)
    await saveMessage({ booking_id: bookingId, client_id: clientId, phone: clientPhone, topic: 'confirmation', content: clientMsg, direction: 'outbound', event: 'cancelled_by_professional' })

    // Confirma à profissional
    const proMsg = 'Feito! Cancelamento realizado e cliente notificada ✅'
    await send(fromPhone, proMsg)
    await saveMessage({ booking_id: bookingId, client_id: clientId, phone: fromPhone, topic: 'confirmation', content: proMsg, direction: 'outbound', event: 'professional_confirmed' })

    // Fecha estado usando a phone da cliente (onde está registrado)
    await supabase.from('whatsapp_states').delete().eq('booking_id', bookingId)
    return
  }

  if (norm.includes('eu resolvo')) {
    // Avisa cliente que a profissional vai contatar
    const clientMsg = `${ownerName} entrará em contato em breve 💬`
    await send(clientPhone, clientMsg)
    await saveMessage({ booking_id: bookingId, client_id: clientId, phone: clientPhone, topic: 'confirmation', content: clientMsg, direction: 'outbound', event: 'professional_takes_over' })

    await supabase.from('whatsapp_states').delete().eq('booking_id', bookingId)
    return
  }

  // Fallback profissional
  const fallback = 'Responda *AUTORIZAR* para cancelar o horário ou *EU RESOLVO* para falar com a cliente diretamente.'
  await send(fromPhone, fallback)
  await saveMessage({ booking_id: bookingId, client_id: clientId, phone: fromPhone, topic: 'confirmation', content: fallback, direction: 'outbound', event: 'fallback' })
}

// ── Ponto de entrada principal ─────────────────────────────────────────────

export async function processIncomingMessage(
  fromPhone: string,
  messageText: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient()

  // Salva inbound imediato (antes de qualquer processamento)
  await saveMessage({
    phone: fromPhone,
    topic: 'inbound',
    content: messageText,
    direction: 'inbound',
    event: null,
  })

  // Busca perfil da profissional
  const { data: profile } = await supabase
    .from('studio_profile')
    .select('phone, owner_name, luna_confirmation_enabled, luna_client_enabled')
    .single()

  if (!profile?.luna_confirmation_enabled && !profile?.luna_client_enabled) return

  const isProfessional =
    profile?.phone && fromPhone.replace(/\D/g, '').endsWith(profile.phone.replace(/\D/g, ''))

  // Busca estado ativo para esse telefone
  let { data: stateRow } = await supabase
    .from('whatsapp_states')
    .select('*')
    .eq('phone', fromPhone)
    .maybeSingle()

  // Se for a profissional, busca estado awaiting_professional (keyed pelo cliente)
  if (isProfessional && !stateRow) {
    const { data: proState } = await supabase
      .from('whatsapp_states')
      .select('*')
      .eq('state', 'awaiting_professional')
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    stateRow = proState
  }

  if (!stateRow) return // Nenhum flow ativo, ignora

  const state = stateRow as Record<string, unknown>
  const flow = state.flow as string
  const stateVal = state.state as string

  if (flow === 'confirmation' && stateVal === 'awaiting_client' && !isProfessional) {
    await handleClientConfirmationReply(state, fromPhone, messageText)
    return
  }

  if (flow === 'confirmation' && stateVal === 'awaiting_professional' && isProfessional) {
    await handleProfessionalReply(state, fromPhone, messageText)
    return
  }

  // Detectar reagendamento fora de flow ativo (cliente escreve espontaneamente)
  if (profile.luna_confirmation_enabled && !isProfessional) {
    const norm = normalize(messageText)
    const rescheduleWords = ['remarcar', 'reagendar', 'mudar', 'alterar']
    if (rescheduleWords.some((w) => norm.includes(w)) && state.booking_id) {
      const payload = (state.payload as Record<string, string>) ?? {}
      await notifyProfessionalAboutReschedule(
        state,
        fromPhone,
        payload,
        state.client_id as string,
        state.booking_id as string,
      )
    }
  }
}
