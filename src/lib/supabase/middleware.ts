import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

  // Public routes — no auth required
  const publicRoutes = ['/', '/login', '/internal', '/get-started']
  const isPublic = publicRoutes.some(route => path === route || path.startsWith(route + '/'))

  if (!user && !isPublic) {
    // Redirect unauthenticated users to the right login page
    const url = request.nextUrl.clone()
    // Express-branded pages (kiosk, staff) go to /internal login
    if (path.startsWith('/kiosk') || path.startsWith('/staff')) {
      url.pathname = '/internal'
    } else {
      url.pathname = '/login'
    }
    return NextResponse.redirect(url)
  }

  if (user && (path === '/login')) {
    // Redirect authenticated users away from login
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const url = request.nextUrl.clone()
    if (profile?.role === 'recruiter') {
      url.pathname = '/staff/dashboard'
    } else if (profile?.role === 'employer') {
      url.pathname = '/browse'
    } else {
      url.pathname = '/dashboard'
    }
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
