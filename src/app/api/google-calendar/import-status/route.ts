// src/app/api/google-calendar/import-status/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data } = await supabase
    .from('studio_profile')
    .select('pending_import_summary')
    .eq('id', user.id)
    .single()

  const done = !!data?.pending_import_summary
  return NextResponse.json({
    done,
    summary: data?.pending_import_summary ?? null,
  })
}

export async function DELETE() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  await supabase
    .from('studio_profile')
    .update({ pending_import_summary: null })
    .eq('id', user.id)

  return NextResponse.json({ ok: true })
}
