// src/app/api/google-calendar/import/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { runInitialImport } from '@/lib/bellu-import'

export async function POST(request: Request) {
  const secret = request.headers.get('x-import-secret')
  const isInternalCall = secret === process.env.CRON_SECRET

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && !isInternalCall) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  if (!user) {
    return new NextResponse('No authenticated user', { status: 400 })
  }

  const userId = user.id

  // Fire and forget — responde 202 imediatamente
  runInitialImport(userId)
    .then(async (summary) => {
      await supabase
        .from('studio_profile')
        .update({ pending_import_summary: JSON.stringify(summary) })
        .eq('id', userId)
    })
    .catch(console.error)

  return NextResponse.json({ status: 'importing' }, { status: 202 })
}
