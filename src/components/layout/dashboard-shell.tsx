"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Sparkles, 
  Wallet, 
  Settings,
  LogOut,
} from "lucide-react";
import { BottomNav } from "./bottom-nav";

const navigationItems = [
  { href: "/dashboard", label: "Resumo", icon: LayoutDashboard },
  { href: "/dashboard/calendar", label: "Agenda", icon: CalendarDays },
  { href: "/dashboard/clients", label: "Clientes", icon: Users },
  { href: "/dashboard/services", label: "Serviços", icon: Sparkles },
  { href: "/dashboard/finance", label: "Finanças", icon: Wallet },
  { href: "/dashboard/settings", label: "Configurações", icon: Settings },
];

type DashboardShellProps = {
  children: ReactNode;
  studioName?: string;
  logoUrl?: string | null;
};

export function DashboardShell({ children, studioName = "Bellu", logoUrl }: DashboardShellProps) {
  return (
    <div className="relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[10%] -left-[5%] w-[400px] h-[400px] rounded-full bg-pink-100/40 blur-3xl" />
        <div className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] rounded-full bg-purple-100/30 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-0 py-0 sm:px-6 sm:py-6 lg:flex-row lg:gap-8 lg:px-8 pb-24 lg:pb-6">
        
        {/* Desktop Sidebar (Hidden on Mobile) */}
        <aside className="hidden flex-col justify-between rounded-[2rem] border border-white/60 bg-white/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl lg:mb-0 lg:flex lg:w-72">
          <div>
            <div className="flex flex-col items-start mb-8">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-white/60 rounded-xl shadow-sm border border-rose-100/50 overflow-hidden">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt={studioName} className="w-5 h-5 object-contain" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-rose-400" strokeWidth={1.5} />
                  )}
                </div>
                <h1 className="text-xl font-light tracking-tight text-stone-800">
                  {studioName}
                </h1>
              </div>
              <p className="text-xs font-medium uppercase tracking-widest text-stone-400">
                Dashboard
              </p>
            </div>

            <nav className="grid gap-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center space-x-3 rounded-2xl px-4 py-3 text-sm font-medium text-stone-500 transition-all duration-300 hover:bg-white hover:text-stone-800 hover:shadow-sm"
                  >
                    <Icon className="w-5 h-5 text-rose-300 group-hover:text-rose-400 transition-colors" strokeWidth={1.5} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-8 pt-8 border-t border-rose-100/50">
            <Link
              href="/"
              className="group flex items-center space-x-3 rounded-2xl px-4 py-3 text-sm font-medium text-rose-500 transition-all duration-300 hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" strokeWidth={1.5} />
              <span>Sair da conta</span>
            </Link>
          </div>
        </aside>

        <main className="flex-1 ">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
