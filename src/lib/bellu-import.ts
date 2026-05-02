// src/lib/bellu-import.ts
import { generateObject } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { z } from 'zod'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { fetchGoogleCalendarEvents } from '@/lib/google-calendar-api'

const ImportResultSchema = z.object({
  bookings: z.array(
    z.object({
      clientName: z.string(),
      procedureTitle: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      googleEventId: z.string(),
    }),
  ),
  personalEvents: z.array(
    z.object({
      googleEventId: z.string(),
      title: z.string(),
      startTime: z.string(),
      endTime: z.string(),
    }),
  ),
})

export type ImportSummary = {
  clientsCreated: number
  proceduresCreated: number
  bookingsCreated: number
  personalEventsSaved: number
  pendingClients: string[]
  pendingProcedures: string[]
}

export async function runInitialImport(userId: string): Promise<ImportSummary> {
  const supabase = await createSupabaseServerClient()

  const timeMin = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const timeMax = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

  const events = await fetchGoogleCalendarEvents({ timeMin, timeMax })

  const summary: ImportSummary = {
    clientsCreated: 0,
    proceduresCreated: 0,
    bookingsCreated: 0,
    personalEventsSaved: 0,
    pendingClients: [],
    pendingProcedures: [],
  }

  if (events.length === 0) return summary

  // Buscar procedimentos já cadastrados para contexto
  const { data: existingProcedures } = await supabase
    .from('procedures')
    .select('id, name, google_calendar_title')

  const proceduresList = (existingProcedures ?? [])
    .map((p) => `- "${p.google_calendar_title ?? p.name}"`)
    .join('\n')

  const eventsText = events
    .filter((e) => e.start.dateTime) // ignorar eventos de dia inteiro
    .map(
      (e) =>
        `ID:${e.id} | Título:"${e.summary ?? ''}" | Início:${e.start.dateTime} | Fim:${e.end.dateTime}`,
    )
    .join('\n')

  if (!eventsText) return summary

  const { object } = await generateObject({
    model: anthropic('claude-sonnet-4-6'),
    schema: ImportResultSchema,
    prompt: `Você é um assistente analisando o Google Calendar de uma nail designer chamada Bellu.

Procedimentos já cadastrados no sistema:
${proceduresList || '(nenhum ainda)'}

Eventos do Google Calendar:
${eventsText}

Tarefa:
1. Identifique quais eventos são AGENDAMENTOS de clientes (nome de cliente + procedimento de nail/unhas/beleza/estética)
2. Para cada agendamento: extraia clientName, procedureTitle, startTime (ISO 8601 com timezone), endTime, googleEventId
3. Eventos que NÃO são agendamentos (médico, reunião, pessoal, aniversário, etc): coloque em personalEvents
4. Se não conseguir identificar claramente: coloque em personalEvents

Retorne o JSON estruturado.`,
  })

  // Salvar eventos pessoais
  for (const ev of object.personalEvents) {
    await supabase.from('google_calendar_events').upsert(
      {
        user_id: userId,
        google_event_id: ev.googleEventId,
        title: ev.title,
        start_time: ev.startTime,
        end_time: ev.endTime,
        is_personal: true,
      },
      { onConflict: 'user_id,google_event_id' },
    )
    summary.personalEventsSaved++
  }

  // Processar bookings
  for (const bk of object.bookings) {
    // Buscar ou criar cliente por nome
    let { data: client } = await supabase
      .from('clients')
      .select('id, phone')
      .ilike('name', bk.clientName.trim())
      .maybeSingle()

    if (!client) {
      const { data: newClient } = await supabase
        .from('clients')
        .insert({ name: bk.clientName.trim() })
        .select('id, phone')
        .single()
      client = newClient
      summary.clientsCreated++
    }

    if (!client?.phone && !summary.pendingClients.includes(bk.clientName)) {
      summary.pendingClients.push(bk.clientName)
    }

    if (!client) continue

    // Buscar ou criar procedimento por título
    let { data: procedure } = await supabase
      .from('procedures')
      .select('id, duration, price')
      .or(
        `name.ilike.%${bk.procedureTitle.trim()}%,google_calendar_title.ilike.%${bk.procedureTitle.trim()}%`,
      )
      .maybeSingle()

    if (!procedure) {
      const { data: newProc } = await supabase
        .from('procedures')
        .insert({
          name: bk.procedureTitle.trim(),
          google_calendar_title: bk.procedureTitle.trim(),
          duration: 60, // default — profissional deve atualizar
          price: 0,
          active: true,
        })
        .select('id, duration, price')
        .single()
      procedure = newProc
      summary.proceduresCreated++
      if (!summary.pendingProcedures.includes(bk.procedureTitle)) {
        summary.pendingProcedures.push(bk.procedureTitle)
      }
    }

    if (!procedure) continue

    // Criar booking (ignorar duplicatas silenciosamente)
    const { error } = await supabase.from('bookings').insert({
      client_id: client.id,
      procedure_id: procedure.id,
      start_time: bk.startTime,
      end_time: bk.endTime,
      status: 'confirmed',
      notes: 'Importado do Google Calendar',
    })

    if (!error) summary.bookingsCreated++

    // Salvar em google_calendar_events como não-pessoal
    await supabase.from('google_calendar_events').upsert(
      {
        user_id: userId,
        google_event_id: bk.googleEventId,
        title: `${bk.clientName} — ${bk.procedureTitle}`,
        start_time: bk.startTime,
        end_time: bk.endTime,
        is_personal: false,
      },
      { onConflict: 'user_id,google_event_id' },
    )
  }

  return summary
}
