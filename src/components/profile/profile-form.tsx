'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, X, LogOut, Trash2, ChevronLeft, Check } from 'lucide-react'
import { toast } from 'sonner'
import { sb as supabase } from '@/lib/supabase-browser'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import Image from 'next/image'

type Props = {
  userId: string
  initialStudioName: string
  initialOwnerName: string
  initialLogoUrl: string | null
  googleAvatar: string | null
  googleName: string | null
  googleEmail: string | null
}

export function ProfileForm({
  userId,
  initialStudioName,
  initialOwnerName,
  initialLogoUrl,
  googleAvatar,
  googleName,
  googleEmail,
}: Props) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [studioName, setStudioName] = useState(initialStudioName)
  const [ownerName, setOwnerName] = useState(initialOwnerName)
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  async function handleSave() {
    if (!studioName.trim()) { toast.error('Nome do studio é obrigatório'); return }
    if (!ownerName.trim()) { toast.error('Como quer ser chamada é obrigatório'); return }
    setSaving(true)
    const { error } = await supabase
      .from('studio_profile')
      .update({ studio_name: studioName.trim(), owner_name: ownerName.trim() })
      .eq('id', userId)
    setSaving(false)
    if (error) { toast.error('Erro ao salvar'); return }
    toast.success('Salvo!')
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/logo.${ext}`
    const { error } = await supabase.storage.from('studio-assets').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('studio-assets').getPublicUrl(path)
      await supabase.from('studio_profile').update({ logo_url: publicUrl }).eq('id', userId)
      setLogoUrl(publicUrl)
    }
    setUploadingLogo(false)
  }

  async function handleLogoRemove() {
    await supabase.from('studio_profile').update({ logo_url: null }).eq('id', userId)
    setLogoUrl(null)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function handleDeleteAccount() {
    await supabase.auth.signOut()
    router.push('/')
  }

  const initials = (googleName ?? 'A').charAt(0).toUpperCase()

  return (
    <div className="min-h-screen ">

      {/* Header da page */}
     

      <div className="px-4 py-6 space-y-4 max-w-md mx-auto">

        {/* ── Studio ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-medium uppercase tracking-widest text-stone-400">Studio</p>
          </div>

          {/* Logo */}
          <div className="flex flex-col items-center py-6 border-b border-stone-50">
            <div className="relative mb-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingLogo}
                className="w-24 h-24 rounded-3xl overflow-hidden bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors"
              >
                {logoUrl ? (
                  <img src={logoUrl} alt={studioName} className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-7 h-7 text-stone-400" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
            {uploadingLogo && (
              <p className="text-xs text-stone-400">Enviando...</p>
            )}
            {logoUrl && !uploadingLogo && (
              <button
                onClick={handleLogoRemove}
                className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors mt-1"
              >
                <X className="w-3 h-3" />
                Remover logo
              </button>
            )}
          </div>

          {/* Nome do studio */}
          <div className="px-4 py-3 border-b border-stone-50">
            <label className="text-xs text-stone-400 block mb-1">Nome do studio</label>
            <input
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              className="w-full text-sm font-medium text-stone-800 bg-transparent outline-none border-b border-transparent focus:border-rose-200 pb-0.5 transition-colors"
            />
          </div>

          {/* Como quer ser chamada */}
          <div className="px-4 py-3 border-b border-stone-50">
            <label className="text-xs text-stone-400 block mb-1">Como quer ser chamada</label>
            <input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full text-sm font-medium text-stone-800 bg-transparent outline-none border-b border-transparent focus:border-rose-200 pb-0.5 transition-colors"
            />
          </div>

          {/* Salvar */}
          <div className="px-4 py-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-rose-400 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>

        {/* ── Conta Google ───────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-medium uppercase tracking-widest text-stone-400">Conta Google</p>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            {googleAvatar ? (
              <Image
                src={googleAvatar}
                alt={googleName ?? ''}
                width={40}
                height={40}
                className="rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 font-medium shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-stone-800 truncate">{googleName}</p>
              <p className="text-xs text-stone-400 truncate">{googleEmail}</p>
            </div>
          </div>
        </div>

        {/* ── Conta ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-4 text-sm text-stone-600 hover:bg-stone-50 transition-colors border-b border-stone-50"
          >
            <LogOut className="w-4 h-4 text-stone-400 shrink-0" />
            Sair da conta
          </button>

          <AlertDialog>
            <AlertDialogTrigger className="flex items-center gap-3 w-full px-4 py-4 text-sm text-rose-400 hover:bg-rose-50 transition-colors">
              <Trash2 className="w-4 h-4 shrink-0" />
              Excluir conta
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir conta</AlertDialogTitle>
                <AlertDialogDescription>
                  Digite <strong>EXCLUIR</strong> para confirmar. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="EXCLUIR"
                className="border border-stone-200 rounded-xl px-3 py-2 text-sm w-full mt-2 outline-none focus:border-rose-300"
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteConfirm('')}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleteConfirm !== 'EXCLUIR'}
                  onClick={handleDeleteAccount}
                  className="bg-rose-500 hover:bg-rose-600 disabled:opacity-40"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

      </div>
    </div>
  )
}
