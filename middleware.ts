import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// UUID v4 pattern for validating staff session cookie
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const pathname = request.nextUrl.pathname

  // Handle admin routes (Supabase auth)
  if (pathname.startsWith('/admin')) {
    if (pathname.startsWith('/admin/login')) {
      return response
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data } = await supabase.auth.getUser()

    if (!data.user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/admin/login'
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return response
  }

  // Handle cashier and kitchen routes (staff session auth)
  const staffMatch = pathname.match(/^\/([^/]+)\/(cashier|kitchen)/)
  if (staffMatch) {
    const restaurantSlug = staffMatch[1]
    const subRoute = staffMatch[2]

    // Allow login page
    if (pathname === `/${restaurantSlug}/${subRoute}/login`) {
      return response
    }

    const sessionCookie = request.cookies.get(`staff_session_${restaurantSlug}`)
    const staffId = sessionCookie?.value?.trim()

    // Reject if no cookie or invalid UUID format
    if (!staffId || !UUID_REGEX.test(staffId)) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = `/${restaurantSlug}/${subRoute}/login`
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Validate staff account exists, is active, and belongs to this restaurant
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && serviceRoleKey) {
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false },
      })

      const { data: staffAccount, error } = await supabase
        .from('staff_accounts')
        .select('id, restaurants(slug)')
        .eq('id', staffId)
        .eq('is_active', true)
        .single()

      const restaurant = staffAccount?.restaurants
        ? (Array.isArray(staffAccount.restaurants)
            ? staffAccount.restaurants[0]
            : staffAccount.restaurants)
        : null

      const isValid =
        !error &&
        staffAccount &&
        restaurant?.slug?.toLowerCase() === restaurantSlug.toLowerCase()

      if (!isValid) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = `/${restaurantSlug}/${subRoute}/login`
        redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }

      // Gate kitchen routes behind subscription feature
      if (subRoute === 'kitchen') {
        const { data: restaurantFeatures } = await supabase
          .from('restaurants')
          .select('subscription_features')
          .eq('slug', restaurantSlug.toLowerCase())
          .single()

        const hasKitchen =
          restaurantFeatures?.subscription_features?.kitchen === true

        if (!hasKitchen) {
          const redirectUrl = request.nextUrl.clone()
          redirectUrl.pathname = `/${restaurantSlug}/cashier`
          return NextResponse.redirect(redirectUrl)
        }
      }
    }
    // If service role key is not configured, fall back to cookie presence only
    // (legacy behavior - add SUPABASE_SERVICE_ROLE_KEY for full validation)

    return response
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/:slug/cashier/:path*', '/:slug/kitchen/:path*'],
}

