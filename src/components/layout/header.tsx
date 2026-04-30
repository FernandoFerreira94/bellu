'use client'

import Image from "next/image"
import Logo from "@/assets/logo-bellu.png"
import { useState, useRef, useEffect } from "react"
import { UserMenu } from "./user-menu"
import { HeaderMenu } from "./header-menu"

export default function Header({
  user,
  userGoogle,
}: {
  user: { studio_name: string; logo_url: string | null; owner_name: string } | null
  userGoogle?: Record<string, string> | null
}) {
  const studioName = user?.studio_name ?? "Bellu"
  const logoUrl = user?.logo_url ?? null
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <header ref={ref} className="flex lg:hidden flex-col bg-white border-b border-stone-100 shadow-sm mb-6 rounded-b-lg">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center space-x-2">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={studioName}
              width={32}
              height={32}
              className="rounded-lg object-contain bg-white/10"
            />
          ) : (
            <Image src={Logo} alt={studioName} width={32} height={32} className="rounded-lg" />
          )}
          <h1 className="text-xl font-medium tracking-tight text-stone-800 font-serif">
            {studioName}
          </h1>
        </div>
        <UserMenu
          initialUser={userGoogle as Record<string, string>}
          onClick={() => setOpen((v) => !v)}
          open={open}
        />
      </div>
      <HeaderMenu
        open={open}
        onClose={() => setOpen(false)}
        user={user}
        userGoogle={userGoogle}
      />
    </header>
  )
}
