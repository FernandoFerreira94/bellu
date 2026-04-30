'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { sb as supabase } from '@/lib/supabase-browser'

type UserMeta = {
  avatar_url?: string
  picture?: string
  full_name?: string
  name?: string
}

type Props = {
  initialUser?: UserMeta
  onClick: () => void
  open: boolean
}

export function UserMenu({ initialUser, onClick, open }: Props) {
  const [user, setUser] = useState<UserMeta | null>(initialUser ?? null)

  useEffect(() => {
    if (initialUser) return
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user.user_metadata as UserMeta)
      }
    })
  }, [initialUser])

  const avatarUrl = user?.avatar_url ?? user?.picture
  const initials = (user?.full_name ?? user?.name ?? 'A').charAt(0).toUpperCase()

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center bg-white w-10 h-10 rounded-full overflow-hidden ring-2 transition-all focus:outline-none ${
        open ? 'ring-rose-300 scale-95' : 'ring-stone-200 focus:ring-rose-300'
      }`}
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
  )
}
