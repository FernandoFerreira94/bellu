import { createSupabaseServerClient } from '@/lib/supabase-server'
import { BelluSettingsClient } from '@/components/bellu/BelluSettingsClient'
import { BelluLocked } from '@/components/bellu/BelluLocked'

export default async function BelluSettingsPage() {
  const supabase = await createSupabaseServerClient()

  const { data: profile } = await supabase
    .from('studio_profile')
    .select('agent_bellu, luna_whatsapp_number, luna_confirmation_enabled, luna_client_enabled')
    .single()

  if (!profile?.agent_bellu) {
    return <BelluLocked />
  }

  const initialConfig = {
    luna_whatsapp_number: profile.luna_whatsapp_number ?? '',
    luna_confirmation_enabled: profile.luna_confirmation_enabled ?? false,
    luna_client_enabled: profile.luna_client_enabled ?? false,
  }

  return <BelluSettingsClient initialConfig={initialConfig} />
}
