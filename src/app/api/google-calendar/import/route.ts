// src/app/api/google-calendar/import/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { runInitialImport } from '@/lib/bellu-import'

export async function POST(request: Request) {
  const secret = request.headers.get('x-import-secret')
  const isInternalCall = secret === process.env.CRON_SECRET

  const supabase = await createSupabaseServerClient()

  let userId: string | null = null

  if (isInternalCall) {
    // Chamada interna (do callback OAuth): buscar userId pelo token salvo
    const { data: tokenRow } = await supabase
      .from('google_tokens')
      .select('user_id')
      .maybeSingle()
    userId = tokenRow?.user_id ?? null
  } else {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })
    userId = user.id
  }

  if (!userId) {
    return new NextResponse('No user found', { status: 400 })
  }

  const uid = userId

  // Fire and forget — responde 202 imediatamente
  runInitialImport(uid)
    .then(async (summary) => {
      await supabase
        .from('studio_profile')
        .update({ pending_import_summary: JSON.stringify(summary) })
        .eq('id', uid)
    })
    .catch(console.error)

  return NextResponse.json({ status: 'importing' }, { status: 202 })
}
