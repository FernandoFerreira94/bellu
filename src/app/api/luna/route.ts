import { streamText, stepCountIs } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { buildLunaSystemPrompt } from '@/lib/luna-context'
import { lunaTools } from '@/lib/luna-tools'

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { messages } = await request.json()
  const system = await buildLunaSystemPrompt()

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system,
    messages,
    tools: lunaTools,
    stopWhen: stepCountIs(5),
  })

  return result.toUIMessageStreamResponse()
}
