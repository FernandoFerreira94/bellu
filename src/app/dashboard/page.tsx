import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Dummy data — será substituído por dados reais na fase de calendário
const todayAppointments = [
  {
    time: "09:00",
    client: "Marina Costa",
    service: "Manutenção de Gel",
    status: "Concluído",
    dotColor: "bg-emerald-400",
  },
  {
    time: "11:30",
    client: "Júlia Almeida",
    service: "Esmaltação + Spa",
    status: "Em atendimento",
    dotColor: "bg-amber-400",
  },
  {
    time: "15:00",
    client: "Beatriz Rocha",
    service: "Alongamento Fibra",
    status: "Próximo",
    dotColor: "bg-purple-400",
  },
];

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("studio_profile")
        .select("owner_name")
        .eq("id", user.id)
        .single()
    : { data: null };

  const ownerName = profile?.owner_name ?? user?.user_metadata?.full_name ?? "Designer";
  const firstName = ownerName.split(" ")[0];

  const today = new Date();
  const todayLabel = format(today, "EEEE, d 'de' MMMM", { locale: ptBR });
  const todayCapitalized = todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 lg:pb-0 px-4">

      {/* Welcome Section */}
      <section className="space-y-1">
        <p className="text-sm font-medium text-stone-500">Bem-vinda de volta</p>
        <h2 className="text-3xl font-medium text-tercery">
          Olá, {firstName} <span className="inline-block animate-wave origin-[70%_70%]">👋</span>
        </h2>
      </section>

      {/* Main Card */}
      <Card className="bg-gradient-to-br from-[#45342a] to-[#D4958A] text-white shadow-2xl rounded-2xl">
        <CardHeader>
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-white/80 mb-1">
              Hoje
            </p>
            <h3 className="text-2xl font-medium">
              {todayCapitalized}
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-8">
            <div>
              <p className="text-3xl font-semibold">3</p>
              <p className="text-sm text-white/80">clientes</p>
            </div>
            <div>
              <p className="text-3xl font-semibold">R$ 360</p>
              <p className="text-sm text-white/80">previsto</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-tercery">
            Agendamentos de hoje
          </h3>
          <Link href="/dashboard/calendar" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            Ver agenda
          </Link>
        </div>

        <div className="grid gap-3">
          {todayAppointments.map((apt, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-white rounded-2xl border border-stone-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center w-12">
                  <span className="text-sm font-semibold text-tercery">{apt.time}</span>
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 ${apt.dotColor}`} />
                </div>
                <div className="h-10 w-px bg-stone-100" />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-tercery">{apt.client}</p>
                  <p className="text-xs text-stone-500">{apt.service}</p>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-full border border-stone-200 text-[10px] font-medium text-stone-500 bg-stone-50/50">
                {apt.status}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bellu CTA Card */}
      <section className="p-5 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 text-center space-y-3">
        <Sparkles className="w-5 h-5 text-primary mx-auto" />
        <p className="text-sm text-tercery px-4">
          Você tem 2 horários livres esta tarde. Que tal compartilhar com clientes?
        </p>
        <button className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-full shadow-sm hover:bg-primary/90 transition-colors">
          <MessageCircleIcon />
          Bellu ✨
        </button>
      </section>

    </div>
  );
}

function MessageCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
    </svg>
  );
}
