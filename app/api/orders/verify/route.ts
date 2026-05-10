import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { getClientIp, isRateLimited } from '@/lib/security/request-guard'

const RATE_LIMIT_WINDOW_MS = 60 * 1000
const RATE_LIMIT_MAX_ATTEMPTS = 20

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.toLowerCase().includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 415 }
      )
    }

    const { confirmationCode, restaurantSlug, tableNumber } = await request.json()

    const clientIp = getClientIp(request.headers)
    const bucketKey = `verify-order:${clientIp}`
    if (isRateLimited({ bucketKey, limit: RATE_LIMIT_MAX_ATTEMPTS, windowMs: RATE_LIMIT_WINDOW_MS })) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please try again shortly.' },
        { status: 429 }
      )
    }

    if (!confirmationCode) {
      return NextResponse.json(
        { error: 'Confirmation code is required' },
        { status: 400 }
      )
    }

    const normalizedCode = String(confirmationCode).trim().toUpperCase()
    if (!/^[A-Z0-9]{4,10}$/.test(normalizedCode)) {
      return NextResponse.json(
        { error: 'Invalid confirmation code format' },
        { status: 400 }
      )
    }

    const normalizedSlug = restaurantSlug ? String(restaurantSlug).trim().toLowerCase() : null
    if (normalizedSlug && !/^[a-z0-9-]{2,80}$/.test(normalizedSlug)) {
      return NextResponse.json(
        { error: 'Invalid restaurant identifier' },
        { status: 400 }
      )
    }

    const normalizedTableNumber = tableNumber ? String(tableNumber).trim() : null
    if (normalizedTableNumber && normalizedTableNumber.length > 20) {
      return NextResponse.json(
        { error: 'Invalid table number' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    let query = supabase
      .from('orders')
      .select(`
        *,
        tables (*),
        restaurants (*),
        order_items (
          *,
          menu_items (*),
          menu_item_modifiers ( id, name )
        )
      `)
      .eq('confirmation_code', normalizedCode)

    if (normalizedSlug) {
      query = query.eq('restaurants.slug', normalizedSlug)
    }
    if (normalizedTableNumber) {
      query = query.eq('tables.table_number', normalizedTableNumber)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const isExpiredPending =
      data.status === 'pending' &&
      data.expires_at &&
      new Date(data.expires_at).getTime() < Date.now()

    if (isExpiredPending) {
      return NextResponse.json(
        { error: 'Order is expired' },
        { status: 410 }
      )
    }

    return NextResponse.json({ order: data })
  } catch (error) {
    console.error('Verify order error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

