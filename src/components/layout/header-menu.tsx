'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  LogOut, Calendar, Clock, Plug, Sparkles, TrendingUp,
  CheckCircle2, XCircle, Camera, X, Pencil, Check, ChevronRight, Bot,
} from 'lucide-react'
import { sb as supabase } from '@/lib/supabase-browser'
import { useBelluUIStore } from '@/store/belluUIStore'

type UserMeta = {
  avatar_url?: string
  picture?: string
  full_name?: string
  name?: string
}

type Props = {
  open: boolean
  onClose: () => void
  user: { studio_name: string; logo_url: string | null; owner_name: string } | null
  userGoogle?: UserMeta | null
}

export function HeaderMenu({ open, onClose, user, userGoogle }: Props) {
  const router = useRouter()
  const setSheetOpen = useBelluUIStore((s) => s.setSheetOpen)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editingField, setEditingField] = useState<'studio_name' | 'owner_name' | null>(null)
  const [studioName, setStudioName] = useState(user?.studio_name ?? '')
  const [ownerName, setOwnerName] = useState(user?.owner_name ?? '')
  const [logoUrl, setLogoUrl] = useState<string | null>(user?.logo_url ?? null)
  const [gcalConnected, setGcalConnected] = useState<boolean | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  useEffect(() => {
    supabase
      .from('google_tokens')
      .select('id')
      .maybeSingle()
      .then(({ data }) => setGcalConnected(!!data))
  }, [])

  async function saveField(field: 'studio_name' | 'owner_name') {
    const value = field === 'studio_name' ? studioName : ownerName
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return
    const payload = field === 'studio_name' ? { studio_name: value } : { owner_name: value }
    await supabase.from('studio_profile').update(payload).eq('id', authUser.id)
    setEditingField(null)
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { setUploadingLogo(false); return }
    const ext = file.name.split('.').pop()
    const path = `${authUser.id}/logo.${ext}`
    const { error } = await supabase.storage.from('studio-assets').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('studio-assets').getPublicUrl(path)
      await supabase.from('studio_profile').update({ logo_url: publicUrl }).eq('id', authUser.id)
      setLogoUrl(publicUrl)
    }
    setUploadingLogo(false)
  }

  async function handleLogoRemove() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return
    await supabase.from('studio_profile').update({ logo_url: null }).eq('id', authUser.id)
    setLogoUrl(null)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const googleAvatar = userGoogle?.avatar_url ?? userGoogle?.picture
  const initials = (userGoogle?.full_name ?? userGoogle?.name ?? 'A').charAt(0).toUpperCase()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          className="overflow-hidden bg-white border-t border-stone-100"
        >
          <div className="px-4 py-4 space-y-1">

            {/* Perfil */}
            <div className="rounded-2xl border border-stone-100 bg-stone-50 p-4 mb-3">
              <div className="flex items-start gap-4 mb-4">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 flex items-center justify-center">
                    {logoUrl ? (
                      <img src={logoUrl} alt={studioName} className="w-full h-full object-cover" />
                    ) : googleAvatar ? (
                      <Image src={googleAvatar} alt="Avatar" width={64} height={64} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-2xl font-medium text-stone-400">{initials}</span>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-stone-200 shadow-sm flex items-center justify-center hover:bg-stone-50 transition-colors"
                  >
                    <Camera className="w-3 h-3 text-stone-500" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  {editingField === 'studio_name' ? (
                    <div className="flex items-center gap-1 mb-1">
                      <input
                        autoFocus
                        value={studioName}
                        onChange={(e) => setStudioName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveField('studio_name')}
                        className="flex-1 text-sm font-semibold text-stone-800 bg-white border border-stone-200 rounded-lg px-2 py-1 outline-none focus:border-rose-300"
                      />
                      <button onClick={() => saveField('studio_name')} className="text-rose-400 hover:text-rose-500">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingField('studio_name')}
                      className="flex items-center gap-1.5 text-sm font-semibold text-stone-800 hover:text-stone-600 mb-1"
                    >
                      {studioName}
                      <Pencil className="w-3 h-3 text-stone-300" />
                    </button>
                  )}

                  {editingField === 'owner_name' ? (
                    <div className="flex items-center gap-1">
                      <input
                        autoFocus
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveField('owner_name')}
                        className="flex-1 text-xs text-stone-500 bg-white border border-stone-200 rounded-lg px-2 py-1 outline-none focus:border-rose-300"
                      />
                      <button onClick={() => saveField('owner_name')} className="text-rose-400 hover:text-rose-500">
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingField('owner_name')}
                      className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-500"
                    >
                      {ownerName}
                      <Pencil className="w-2.5 h-2.5 text-stone-300" />
                    </button>
                  )}
                </div>
              </div>

              {logoUrl && (
                <button
                  onClick={handleLogoRemove}
                  className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-500 transition-colors mb-3"
                >
                  <X className="w-3 h-3" />
                  Remover logo
                </button>
              )}

              <Link
                href="/dashboard/profile"
                onClick={onClose}
                className="flex items-center justify-between w-full pt-3 border-t border-stone-100 text-xs text-stone-400 hover:text-stone-600 transition-colors"
              >
                Ver perfil completo
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Nav */}
            <Link
              href="/dashboard/services"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-800 transition-colors text-sm"
            >
              <Calendar className="w-4 h-4 shrink-0 text-stone-400" />
              Serviços
            </Link>

            <Link
              href="/dashboard/settings"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-800 transition-colors text-sm"
            >
              <Clock className="w-4 h-4 shrink-0 text-stone-400" />
              Horários de expediente
            </Link>

            <Link
              href="/dashboard/bellu"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-800 transition-colors text-sm"
            >
              <Bot className="w-4 h-4 shrink-0 text-stone-400" />
              Bellu — Configurações
            </Link>

            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-3 text-stone-600 text-sm">
                <Plug className="w-4 h-4 shrink-0 text-stone-400" />
                Google Calendar
              </div>
              {gcalConnected === null ? null : gcalConnected ? (
                <span className="flex items-center gap-1 text-xs text-emerald-500">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
                </span>
              ) : (
                <button className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-500 transition-colors">
                  <XCircle className="w-3.5 h-3.5" /> Reconectar
                </button>
              )}
            </div>

            <Link
              href="/dashboard/finance"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-800 transition-colors text-sm"
            >
              <TrendingUp className="w-4 h-4 shrink-0 text-stone-400" />
              Financeiro
            </Link>

            <button
              onClick={() => { setSheetOpen(true); onClose() }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-800 transition-colors text-sm"
            >
              <Sparkles className="w-4 h-4 shrink-0 text-rose-300" />
              Bellu ✨
            </button>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-stone-400 hover:bg-stone-50 hover:text-stone-600 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sair
            </button>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
