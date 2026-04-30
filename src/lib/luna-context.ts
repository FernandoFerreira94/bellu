// src/lib/luna-context.ts
import { createSupabaseServerClient } from '@/lib/supabase-server'

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export async function buildLunaSystemPrompt(): Promise<string> {
  const supabase = await createSupabaseServerClient()

  const [{ data: profile }, { data: workingHours }, { data: procedures }] = await Promise.all([
    supabase
      .from('studio_profile')
      .select('studio_name, owner_name')
      .single(),
    supabase
      .from('working_hours')
      .select('day_of_week, start_time, end_time, active')
      .order('day_of_week'),
    supabase
      .from('procedures')
      .select('id, name, duration, price')
      .eq('luna_enabled', true)
      .eq('active', true)
      .order('name'),
  ])

  const schedule = (workingHours ?? [])
    .map((wh) => {
      const label = DAY_NAMES[wh.day_of_week] ?? `Dia ${wh.day_of_week}`
      const horario = wh.active
        ? `${wh.start_time.slice(0, 5)} – ${wh.end_time.slice(0, 5)}`
        : 'Folga'
      return `${label}: ${horario}`
    })
    .join('\n')

  const servicesList = (procedures ?? [])
    .map((p) => `- ${p.name}: ${p.duration} min, R$ ${Number(p.price).toFixed(2)}`)
    .join('\n')

  const now = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'full',
    timeStyle: 'short',
  })

  const ownerName = profile?.owner_name ?? 'profissional'
  const studioName = profile?.studio_name ?? 'estúdio'

  return `Você é Luna, assistente pessoal da ${ownerName} do ${studioName}.
Data e hora atual: ${now}

Horários de trabalho:
${schedule || 'Não configurado'}

Serviços disponíveis (você pode oferecer):
${servicesList || 'Nenhum serviço cadastrado'}

Regras obrigatórias:
- Buffer mínimo de 30 minutos entre procedimentos.
- Nunca agendar fora do horário de trabalho configurado.
- Confirme antes de cancelar qualquer agendamento.
- Linguagem informal, como assistente pessoal.
- Respostas curtas; detalhes só se pedido.
- Ao criar agendamento, confirme nome da cliente, procedimento e horário antes de salvar.`
}
