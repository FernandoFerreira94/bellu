// src/lib/bellu-context.ts
import { createSupabaseServerClient } from '@/lib/supabase-server'

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

export async function buildBelluSystemPrompt(): Promise<string> {
  const supabase = await createSupabaseServerClient()

  const now = new Date()
  const today = now.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const todayISO = now.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }) // YYYY-MM-DD
  const tomorrowISO = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    .toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
  const nowStr = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })

  const [
    { data: profile },
    { data: workingHours },
    { data: procedures },
    { data: todayBookings },
    { data: gcalEvents },
  ] = await Promise.all([
    supabase.from('studio_profile').select('studio_name, owner_name').single(),
    supabase.from('working_hours').select('day_of_week, start_time, end_time, active').order('day_of_week'),
    supabase
      .from('procedures')
      .select('id, name, duration, price')
      .eq('luna_enabled', true)
      .eq('active', true)
      .order('name'),
    supabase
      .from('bookings')
      .select('id, start_time, end_time, status, notes, clients(name, phone), procedures(name, duration, price)')
      .gte('start_time', `${todayISO}T00:00:00`)
      .lte('start_time', `${todayISO}T23:59:59`)
      .neq('status', 'cancelled')
      .order('start_time'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('google_calendar_events')
      .select('title, start_time, end_time')
      .gte('start_time', `${todayISO}T00:00:00`)
      .lte('start_time', `${tomorrowISO}T23:59:59`)
      .eq('is_personal', true)
      .order('start_time') as Promise<{ data: { title: string; start_time: string; end_time: string }[] | null }>,
  ])

  const ownerName = profile?.owner_name ?? 'profissional'
  const studioName = profile?.studio_name ?? 'estúdio'

  // Expediente
  const scheduleLines = (workingHours ?? [])
    .map((wh) => {
      const label = DAY_NAMES[wh.day_of_week] ?? `Dia ${wh.day_of_week}`
      return wh.active
        ? `${label}: ${wh.start_time.slice(0, 5)} – ${wh.end_time.slice(0, 5)}`
        : `${label}: Folga`
    })
    .join('\n')

  // Serviços
  const servicesList = (procedures ?? [])
    .map((p) => `- ${p.name} (id: ${p.id}) | ${p.duration} min | R$ ${Number(p.price).toFixed(2)}`)
    .join('\n')

  // Agenda de hoje
  type Booking = {
    id: string
    start_time: string
    end_time: string
    status: string
    notes: string | null
    clients: { name: string; phone: string | null } | null
    procedures: { name: string; duration: number; price: number } | null
  }

  const bookingsToday = (todayBookings ?? []) as Booking[]
  const todayAgenda =
    bookingsToday.length === 0
      ? 'Nenhum agendamento hoje.'
      : bookingsToday
          .map((b) => {
            const cliente = b.clients?.name ?? '?'
            const fone = b.clients?.phone ? ` (${b.clients.phone})` : ''
            const proc = b.procedures?.name ?? '?'
            const inicio = fmtTime(b.start_time)
            const fim = fmtTime(b.end_time)
            const obs = b.notes ? ` — obs: ${b.notes}` : ''
            return `• ${inicio}–${fim} | ${cliente}${fone} | ${proc}${obs} [id: ${b.id}]`
          })
          .join('\n')

  // Google Calendar
  const gcalLines = (gcalEvents ?? [])
    .map((ev) => `• ${fmtTime(ev.start_time)}–${fmtTime(ev.end_time)} | ${ev.title}`)
    .join('\n')

  const gcalSection = gcalLines
    ? `\n## Compromissos pessoais hoje/amanhã (Google Calendar — não são atendimentos)\n${gcalLines}\n`
    : ''

  return `Você é Bellu, assistente pessoal da ${ownerName} no ${studioName}.
Hoje: ${today} | Agora: ${nowStr}

## O que você faz
Você gerencia a agenda e o negócio da ${ownerName}. Suas capacidades:
- Consultar a agenda (hoje, amanhã, qualquer data ou período)
- Verificar horários disponíveis para um serviço
- Criar e cancelar agendamentos
- Buscar clientes por nome ou telefone
- Resumir faturamento, receitas e despesas de qualquer período
- Formatar horários livres para postar no WhatsApp ou Instagram
- Verificar compromissos pessoais do Google Calendar para evitar conflitos

## Expediente configurado
${scheduleLines || 'Não configurado.'}

## Serviços disponíveis
${servicesList || 'Nenhum serviço cadastrado.'}

## Agenda de hoje — ${todayISO}
${todayAgenda}
${gcalSection}
## Regras e comportamento

### Ao criar agendamento
1. Buscar cliente com get_clients (precisa do id)
2. Verificar slots com get_available_slots para a data e procedimento
3. Apresentar opções e confirmar com a ${ownerName} (nome, serviço, horário)
4. Só então chamar create_booking

### Se cliente não estiver cadastrado
Avise: "Não encontrei [nome] no sistema. Cadastre ela em Clientes antes de agendar."

### Ao cancelar agendamento
Sempre confirmar antes. Perguntar: "Tem certeza que quer cancelar [cliente] – [serviço] às [hora]?"

### Ao editar horário de um agendamento
Não há edição direta. Cancele o atual e crie um novo.

### Ao formatar horários livres para redes sociais
Use este formato:
📅 Horários disponíveis — [data por extenso]
⏰ [hora] — [serviço]
⏰ [hora] — [serviço]
📲 Para agendar, chame no WhatsApp!

### Conflitos com Google Calendar
Antes de confirmar horário, verifique se há evento pessoal na mesma janela. Se houver, avise.

### Buffer obrigatório
30 minutos entre todos os atendimentos. Já considerado em get_available_slots.

### Tom e respostas
- Linguagem informal, como assistente de confiança
- Respostas curtas e diretas
- Só detalha quando pedido
- Nunca inventar horários ou IDs — sempre usar as tools`
}
