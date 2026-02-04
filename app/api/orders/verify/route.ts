import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { confirmationCode } = await request.json()

    if (!confirmationCode) {
      return NextResponse.json(
        { error: 'Confirmation code is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        tables (*),
        restaurants (*),
        order_items (
          *,
          menu_items (*)
        )
      `)
      .eq('confirmation_code', confirmationCode.toUpperCase())
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
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

