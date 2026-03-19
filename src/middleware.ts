import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { MARKETING_ROUTES } from '@/lib/domains'

// Production hostnames
const MARKETING_HOST = 'www.thepaybureau.com'
const BARE_HOST = 'thepaybureau.com'
const APP_HOST = 'app.thepaybureau.com'

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.replace(/:\d+$/, '') || ''
  const pathname = request.nextUrl.pathname

  // Bare domain → www redirect
  if (host === BARE_HOST) {
    const url = new URL(pathname, `https://${MARKETING_HOST}`)
    url.search = request.nextUrl.search
    return NextResponse.redirect(url, 301)
  }

  // Vercel default domain → app redirect
  if (host.endsWith('.vercel.app')) {
    const url = new URL(pathname, `https://${APP_HOST}`)
    url.search = request.nextUrl.search
    return NextResponse.redirect(url, 301)
  }

  // Marketing domain — only serve marketing routes, redirect everything else to app
  if (host === MARKETING_HOST) {
    // Allow newsletter subscribe API on marketing domain (form is in the footer)
    if (pathname === '/api/newsletter/subscribe') {
      return NextResponse.next({ request })
    }

    const isMarketingRoute = MARKETING_ROUTES.some((route) =>
      route === '/' ? pathname === '/' : pathname === route || pathname.startsWith(route + '/')
    )

    if (!isMarketingRoute) {
      const url = new URL(pathname, `https://${APP_HOST}`)
      url.search = request.nextUrl.search
      return NextResponse.redirect(url, 301)
    }

    // Marketing routes need no auth — return early
    return NextResponse.next({ request })
  }

  // App domain: redirect root to dashboard (chains to /login if unauthenticated)
  if (host === APP_HOST && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', `https://${APP_HOST}`), 307)
  }

  // --- Below here: app.thepaybureau.com and localhost (existing logic) ---

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

  // CSRF protection for mutating API requests — verify origin matches
  if (request.nextUrl.pathname.startsWith('/api/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    // Exempt endpoints called by external services without Origin
    const isExempt = request.nextUrl.pathname.startsWith('/api/stripe/webhook')
      || request.nextUrl.pathname.startsWith('/api/v1/')
      || request.nextUrl.pathname.startsWith('/api/cron/')
    if (!isExempt) {
      const origin = request.headers.get('origin')
      const host = request.headers.get('host')
      if (!origin || !host) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const originHost = new URL(origin).host
      if (originHost !== host) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
  }

  // Refresh the session — this is critical for keeping auth alive.
  // Wrapped in try/catch so Supabase downtime doesn't 500 the entire app.
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Supabase is unreachable — allow public pages, block dashboard
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'service_unavailable')
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Protect dashboard routes — redirect to login if not authenticated
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (user && (
    request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname === '/signup' ||
    request.nextUrl.pathname === '/register'
  )) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Match all routes except static files, images, and API routes
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
