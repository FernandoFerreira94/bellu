import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Sem sessão → proteger dashboard
  if (!user && path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (user) {
    const { data: profile } = await supabase
      .from('studio_profile')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    const completed = profile?.onboarding_completed ?? false

    // Sessão sem onboarding → forçar onboarding (exceto rota de callback)
    if (!completed && !path.startsWith('/onboarding') && !path.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // Sessão com onboarding completo + página de login → dashboard
    if (completed && path === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/onboarding'],
}
