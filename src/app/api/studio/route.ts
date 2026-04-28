import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { z } from 'zod'

const studioSchema = z.object({
  studio_name: z.string().min(2, 'Mínimo 2 caracteres'),
  owner_name: z.string().min(2, 'Mínimo 2 caracteres'),
  specialty: z.enum(['nail_designer', 'hair', 'makeup', 'waxing', 'massage', 'other']),
  logo_url: z.string().url().nullable().optional(),
})

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = studioSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('studio_profile')
    .upsert({
      id: user.id,
      studio_name: parsed.data.studio_name,
      owner_name: parsed.data.owner_name,
      specialty: parsed.data.specialty,
      logo_url: parsed.data.logo_url ?? null,
      onboarding_completed: true,
    })

  if (error) {
    return NextResponse.json({ error: 'Erro ao salvar perfil' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
