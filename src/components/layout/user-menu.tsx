'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLunaUIStore } from '@/store/lunaUIStore'

type UserMeta = {
  avatar_url?: string
  picture?: string
  full_name?: string
  name?: string
  email?: string
}

export function UserMenu({ initialUser }: { initialUser?: UserMeta }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<UserMeta | null>(initialUser ?? null)
  const ref = useRef<HTMLDivElement>(null)
  const setWidgetOpen = useLunaUIStore((s) => s.setWidgetOpen)
   
  useEffect(() => {
    if (initialUser) return
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user.user_metadata as UserMeta)
      }
    })
  }, [initialUser])

  // close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  function handleOpenLuna() {
    setOpen(false)
    setWidgetOpen(true)
  }

  const avatarUrl = user?.avatar_url ?? user?.picture
  const initials = (user?.full_name ?? user?.name ?? 'A').charAt(0).toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center bg-white w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary/20 focus:outline-none focus:ring-primary/50"
        aria-label="Menu do usuário"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Foto de perfil"
            width={40}
            height={40}
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="bg-primary/10 text-primary font-medium text-sm w-full h-full flex items-center justify-center">
            {initials}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-lg border border-stone-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            type="button"
            onClick={handleOpenLuna}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-tercery hover:bg-stone-50 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            Luna ✨
          </button>
          <div className="h-px bg-stone-100" />
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-rose-500 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      )}
    </div>
  )
}
