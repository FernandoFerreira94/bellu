import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { ProfileForm } from '@/components/profile/profile-form'

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('studio_profile')
    .select('studio_name, logo_url, owner_name')
    .eq('id', user.id)
    .single()

  const meta = user.user_metadata

  return (
    <ProfileForm
      userId={user.id}
      initialStudioName={profile?.studio_name ?? ''}
      initialOwnerName={profile?.owner_name ?? ''}
      initialLogoUrl={profile?.logo_url ?? null}
      googleAvatar={meta?.avatar_url ?? meta?.picture ?? null}
      googleName={meta?.full_name ?? meta?.name ?? null}
      googleEmail={user.email ?? null}
    />
  )
}
