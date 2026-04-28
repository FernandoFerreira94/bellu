"use client"
import Image from "next/image";
import Logo from "@/assets/logo-bellu.png"
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useState } from "react";
import { toast } from "sonner";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2s2.7-6.2 6-6.2c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"/>
  </svg>
);

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  async function handleGoogleLogin() {
    setLoading(true)
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      toast.error('Erro ao entrar com Google. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-6 py-12 flex flex-col items-center justify-between relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex items-center justify-center w-full">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center space-y-3">
            <div className="p-4">
              <Image src={Logo} alt="Logo" width={80} height={80} />
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-4xl flex items-center justify-center font-extralight text-tercery font-mono">
                Be <span className="text-primary font-medium font-serif">llu</span>
              </h1>
              <p className="text-sm tracking-widest text-zinc-500 mt-2">Seu negócio na palma da mão</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-4 pb-4">
        <Button onClick={handleGoogleLogin} disabled={loading}>
          <GoogleIcon />
          {loading ? 'Entrando...' : 'Entrar com Google'}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          Ao continuar, você concorda com os termos de uso.
        </p>
      </div>
    </main>
  );
}
