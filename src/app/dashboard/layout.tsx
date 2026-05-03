import type { ReactNode } from "react";
import { Suspense } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { BelluSheet } from "@/components/bellu/BelluSheet";
import { UserMenu } from "@/components/layout/user-menu";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import Header from "@/components/layout/header";
import { SyncIndicator } from "@/components/sync/SyncIndicator";
import { GcalToast } from "@/components/settings/GcalToast";
import { GoogleCalendarWelcomeDialog } from "@/components/google-calendar/GoogleCalendarWelcomeDialog";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("studio_profile")
        .select("studio_name, logo_url, owner_name, agent_bellu")
        .eq("id", user.id)
        .single()
    : { data: null };

  const userGoogle = user?.user_metadata;

  return (
    <>
      <Header user={profile} userGoogle={userGoogle} />

      <DashboardShell studioName={profile?.studio_name} logoUrl={profile?.logo_url} agentBellu={profile?.agent_bellu}>
        {children}
      </DashboardShell>

      {profile?.agent_bellu && <BelluSheet />}
      <SyncIndicator />
      <GoogleCalendarWelcomeDialog />
      <Suspense fallback={null}>
        <GcalToast />
      </Suspense>
    </>
  );
}
