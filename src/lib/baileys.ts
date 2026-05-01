import { z } from 'zod'
import makeWASocket, {
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys'
import type { AuthenticationState } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import { createClient } from '@supabase/supabase-js'
import type { WhatsAppSession } from '@/types'

// ── Zod schema (mantido para compatibilidade com route.ts) ─────────────────
export const whatsappMessageSchema = z.object({
  phone: z.string().min(8, 'Telefone inválido.'),
  message: z.string().min(1, 'Mensagem obrigatória.'),
})
export type WhatsAppMessageInput = z.infer<typeof whatsappMessageSchema>

// ── Supabase admin client (service role para Storage sem cookie) ───────────
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) throw new Error('Supabase env vars ausentes')

  return createClient(url, key)
}

const BUCKET = 'studio-assets'
const SESSION_PREFIX = 'whatsapp-session'
const CREDS_PATH = `${SESSION_PREFIX}/creds.json`

// ── Storage helpers ────────────────────────────────────────────────────────
async function downloadCreds(): Promise<object | null> {
  try {
    const sb = getSupabaseAdmin()
    const { data, error } = await sb.storage.from(BUCKET).download(CREDS_PATH)
    if (error || !data) return null
    const text = await data.text()
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function uploadCreds(creds: object): Promise<void> {
  const sb = getSupabaseAdmin()
  const blob = new Blob([JSON.stringify(creds)], { type: 'application/json' })
  const { error } = await sb.storage
    .from(BUCKET)
    .upload(CREDS_PATH, blob, { upsert: true, contentType: 'application/json' })
  if (error) throw new Error(`Falha ao salvar credenciais: ${error.message}`)
}

async function credsExist(): Promise<boolean> {
  try {
    const sb = getSupabaseAdmin()
    const { data } = await sb.storage.from(BUCKET).list(SESSION_PREFIX)
    return (data ?? []).some((f) => f.name === 'creds.json')
  } catch {
    return false
  }
}

// ── Auth state adaptado para Supabase Storage ──────────────────────────────
async function useSupabaseAuthState(): Promise<{
  state: AuthenticationState
  saveCreds: () => Promise<void>
}> {
  // Baixa creds salvas ou usa vazio
  const saved = await downloadCreds()

  // useMultiFileAuthState espera um diretório em disco —
  // emulamos via objeto em memória serializado igual ao formato do Baileys
  const { state, saveCreds: _saveLocal } = await useMultiFileAuthState(
    process.env.WHATSAPP_SESSION_PATH ?? './whatsapp-session',
  )

  // Se havia creds salvas no Supabase, injeta no state
  if (saved) {
    Object.assign(state.creds, saved)
  }

  async function saveCreds() {
    await _saveLocal()
    await uploadCreds(state.creds)
  }

  return { state, saveCreds }
}

// ── initBaileysSession ─────────────────────────────────────────────────────
export async function initBaileysSession() {
  try {
    const { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useSupabaseAuthState()

    const sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, console as never),
      },
      printQRInTerminal: true,
      syncFullHistory: false,
    })

    sock.ev.on('creds.update', saveCreds)

    return { sock, saveCreds }
  } catch (err) {
    throw new Error(`Falha ao inicializar sessão Baileys: ${(err as Error).message}`)
  }
}

// ── sendWhatsAppMessage ────────────────────────────────────────────────────
export async function sendWhatsAppMessage(
  input: WhatsAppMessageInput,
): Promise<{ queued: boolean }> {
  whatsappMessageSchema.parse(input)

  try {
    const { sock, saveCreds } = await initBaileysSession()

    // Formata número → 55 + DDD + número, sem caracteres especiais
    const digits = input.phone.replace(/\D/g, '')
    const jid =
      digits.startsWith('55') ? `${digits}@s.whatsapp.net` : `55${digits}@s.whatsapp.net`

    await sock.sendMessage(jid, { text: input.message })
    await saveCreds()
    await sock.end(undefined)

    return { queued: true }
  } catch (err) {
    throw new Error(`Falha ao enviar mensagem WhatsApp: ${(err as Error).message}`)
  }
}

// ── getWhatsAppStatus ──────────────────────────────────────────────────────
export async function getWhatsAppStatus(): Promise<{
  connected: boolean
  phone: string | null
}> {
  try {
    const exists = await credsExist()
    if (!exists) return { connected: false, phone: null }

    const creds = (await downloadCreds()) as Record<string, unknown> | null
    const phone = (creds?.me as { id?: string } | undefined)?.id?.split('@')[0] ?? null

    return { connected: !!phone, phone }
  } catch {
    return { connected: false, phone: null }
  }
}

// ── Funções legadas (compatibilidade com route.ts) ─────────────────────────
export async function createWhatsAppSession(): Promise<WhatsAppSession> {
  const { connected, phone } = await getWhatsAppStatus()

  return {
    id: 'default',
    status: connected ? 'connected' : 'disconnected',
    qrCode: null,
    phone: phone,
    sessionPath: process.env.WHATSAPP_SESSION_PATH ?? './whatsapp-session',
    updatedAt: new Date().toISOString(),
  }
}

export async function getWhatsAppSession(): Promise<WhatsAppSession> {
  return createWhatsAppSession()
}
