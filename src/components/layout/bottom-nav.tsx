"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Users, Sparkles } from "lucide-react";
import { useLunaUIStore } from "@/store/lunaUIStore";

export function BottomNav() {
  const pathname = usePathname();
  const setSheetOpen = useLunaUIStore((s) => s.setSheetOpen);

  const navItems = [
    { href: "/dashboard", label: "Início", icon: Home, match: "/dashboard" },
    { href: "/dashboard/calendar", label: "Agenda", icon: Calendar, match: "/dashboard/calendar" },
    { href: "/dashboard/clients", label: "Clientes", icon: Users, match: "/dashboard/clients" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-stone-200/50 pb-safe z-50 lg:hidden shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-around px-2 py-3 h-16">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
                isActive ? "text-primary" : "text-stone-400 hover:text-stone-600"
              }`}
            >
              <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Luna — abre Sheet */}
        <button
          onClick={() => setSheetOpen(true)}
          className="flex flex-col items-center justify-center gap-1 w-full h-full transition-colors text-stone-400 hover:text-rose-400"
        >
          <Sparkles className="w-5 h-5" strokeWidth={2} />
          <span className="text-[10px] font-medium">Luna</span>
        </button>
      </div>
    </nav>
  );
}
