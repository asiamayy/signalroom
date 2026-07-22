import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/auth', '/privacy', '/terms', '/contact', '/forgot-password', '/reset-password', '/faq', '/r']

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip middleware entirely for public routes
  const isPublic = PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith('/auth/') || pathname.startsWith('/r/')
  )

  const isDashboardRoute =
    pathname.startsWith('/personas') ||
    pathname.startsWith('/interviews') ||
    pathname.startsWith('/reports') ||
    pathname.startsWith('/settings')

  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')

  // Public pages — just pass through, no Supabase call needed
  if (isPublic && !isAuthRoute) {
    return NextResponse.next({ request })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
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
  })

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users away from dashboard
  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from auth pages
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/home'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
