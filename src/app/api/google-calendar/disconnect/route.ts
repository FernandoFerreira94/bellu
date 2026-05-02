// src/app/api/google-calendar/disconnect/route.ts
import { NextResponse } from 'next/server'
import { deleteGoogleTokens } from '@/lib/google-token'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST() {
  const supabase = await createSupabaseServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return new NextResponse('Unauthorized', { status: 401 })

  await deleteGoogleTokens()
  return NextResponse.json({ success: true })
}
