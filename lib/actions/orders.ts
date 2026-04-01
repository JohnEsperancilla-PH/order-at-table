'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getRestaurantBySlug } from './restaurants'

type AuditActorType = 'system' | 'cashier' | 'admin'

async function writeAuditLog(params: {
  restaurantId: string
  action: string
  entityType: string
  entityId?: string
  actorType?: AuditActorType
  actorId?: string
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  await supabase.from('audit_logs').insert({
    restaurant_id: params.restaurantId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId || null,
    actor_type: params.actorType || 'system',
    actor_id: params.actorId || null,
    metadata: params.metadata || null,
  })
}

export async function getTable(tableId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('tables')
    .select('*, restaurants(*)')
    .eq('id', tableId)
    .eq('is_active', true)
    .single()

  if (error) {
    throw new Error(`Table not found: ${error.message}`)
  }

  return data
}

export async function getTableByNumber(tableNumber: string, restaurantId?: string) {
  const supabase = await createClient()
  
  let query = supabase
    .from('tables')
    .select('*, restaurants(*)')
    .eq('table_number', tableNumber)
    .eq('is_active', true)

  if (restaurantId) {
    query = query.eq('restaurant_id', restaurantId)
  }

  const { data, error } = await query.limit(1).maybeSingle()

  if (error || !data) {
    throw new Error(`Table not found: ${error?.message || 'No active table found'}`)
  }

  return data
}

export async function getTableByRestaurantSlugAndNumber(restaurantSlug: string, tableNumber: string) {
  // First get the restaurant to get its ID
  const restaurant = await getRestaurantBySlug(restaurantSlug)
  
  if (!restaurant) {
    throw new Error('Restaurant not found')
  }

  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('tables')
    .select('*, restaurants(*)')
    .eq('restaurant_id', restaurant.id)
    .eq('table_number', tableNumber)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    throw new Error(`Table not found for restaurant: ${error?.message || 'No active table found'}`)
  }

  return data
}

export async function getMenuItems(restaurantId: string, includeUnavailable = false) {
  const supabase = await createClient()
  
  let query = supabase
    .from('menu_items')
    .select('*, menu_categories(*)')
    .eq('restaurant_id', restaurantId)
    .order('display_order', { ascending: true })

  if (!includeUnavailable) {
    query = query.eq('is_available', true)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch menu: ${error.message}`)
  }

  return data || []
}

export async function getMenuCategories(restaurantId: string, includeInactive = false) {
  const supabase = await createClient()

  let query = supabase
    .from('menu_categories')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('display_order', { ascending: true })

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`)
  }

  return data || []
}

// Slug-based menu functions for cashier/admin
export async function getMenuItemsByRestaurantSlug(restaurantSlug: string, includeUnavailable = false) {
  // Get restaurant to verify it exists and get its ID
  const restaurant = await getRestaurantBySlug(restaurantSlug)
  if (!restaurant) {
    return []
  }

  const supabase = await createClient()
  
  let query = supabase
    .from('menu_items')
    .select('*, menu_categories(*)')
    .eq('restaurant_id', restaurant.id)
    .order('display_order', { ascending: true })

  if (!includeUnavailable) {
    query = query.eq('is_available', true)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch menu: ${error.message}`)
  }

  return data || []
}

export async function getMenuCategoriesByRestaurantSlug(restaurantSlug: string, includeInactive = false) {
  // Get restaurant to verify it exists and get its ID
  const restaurant = await getRestaurantBySlug(restaurantSlug)
  if (!restaurant) {
    return []
  }

  const supabase = await createClient()

  let query = supabase
    .from('menu_categories')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('display_order', { ascending: true })

  if (!includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`)
  }

  return data || []
}

export async function getActiveOrder(tableId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        menu_items (*)
      )
    `)
    .eq('table_id', tableId)
    .in('status', ['pending', 'awaiting_cashier_confirmation', 'confirmed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch order: ${error.message}`)
  }

  return data || null
}

// Fetch active order for a specific customer session on a table
export async function getActiveOrderForSession(tableId: string, customerSessionId: string) {
  if (!customerSessionId) return null
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        menu_items (*)
      )
    `)
    .eq('table_id', tableId)
    .eq('customer_session_id', customerSessionId)
    .in('status', ['pending', 'awaiting_cashier_confirmation', 'confirmed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch session order: ${error.message}`)
  }

  return data || null
}

export async function getOrderById(orderId: string, tableNumber?: string) {
  const supabase = await createClient()

  // Use left join instead of inner join to prevent failures if relationships are missing
  // Then validate the relationships afterward
  let query = supabase
    .from('orders')
    .select(`
      *,
      tables (*, restaurants (*)),
      order_items (
        *,
        menu_items (*)
      )
    `)
    .eq('id', orderId)

  if (tableNumber) {
    // Validate table number separately to avoid filter issues
    query = query.eq('tables.table_number', tableNumber)
  }

  const { data, error } = await query.single()

  if (error) {
    throw new Error(`Failed to fetch order: ${error.message}`)
  }

  if (!data) {
    throw new Error('Order not found')
  }

  // Ensure required relationships exist
  if (!data.tables) {
    throw new Error('Order table relationship not found')
  }

  if (tableNumber && data.tables.table_number !== tableNumber) {
    throw new Error('Table number mismatch')
  }

  return data
}

export async function createOrder(
  tableId: string,
  restaurantId: string,
  items: Array<{ menu_item_id: string; quantity: number; price: number }>,
  discountCode?: string,
  customerSessionId?: string,
  customerName?: string,
  idempotencyKey?: string
) {
  const supabase = await createClient()

  // Return the existing order for retry-safe submissions.
  if (idempotencyKey) {
    const { data: existingByKey } = await supabase
      .from('orders')
      .select(`
        *,
        tables (*),
        order_items (
          *,
          menu_items (*)
        )
      `)
      .eq('restaurant_id', restaurantId)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()

    if (existingByKey) {
      return existingByKey
    }
  }

  // If session provided, prevent duplicate active orders for the same session
  let existingOrder = null
  if (customerSessionId) {
    existingOrder = await getActiveOrderForSession(tableId, customerSessionId)
    if (existingOrder) {
      throw new Error('You already have an active order for this table')
    }
  }

  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // Validate item availability to prevent ordering unavailable items
  const itemIds = items.map(item => item.menu_item_id)
  const { data: menuItems, error: itemsError } = await supabase
    .from('menu_items')
    .select('id, name, is_available')
    .in('id', itemIds)

  if (itemsError) {
    throw new Error(`Failed to validate items: ${itemsError.message}`)
  }

  if (!menuItems || menuItems.length !== itemIds.length) {
    throw new Error('Some items are no longer available')
  }

  const unavailableItems = menuItems.filter(item => !item.is_available)
  if (unavailableItems.length > 0) {
    const names = unavailableItems.map(item => item.name).join(', ')
    throw new Error(`Unavailable items: ${names}`)
  }

  // Apply discount if provided
  let discountAmount = 0
  let discountCodeId: string | null = null

  if (discountCode) {
    const { data: discount, error: discountError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('code', discountCode.toUpperCase())
      .eq('is_active', true)
      .single()

    if (!discountError && discount) {
      // Check expiration
      if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
        throw new Error('Discount code has expired')
      }

      // Check if single-use and already used
      if (discount.is_single_use) {
        const { data: used } = await supabase
          .from('order_discounts')
          .select('*')
          .eq('discount_code_id', discount.id)
          .limit(1)
          .maybeSingle()

        if (used) {
          throw new Error('Discount code has already been used')
        }
      }

      discountCodeId = discount.id

      if (discount.discount_type === 'percentage') {
        discountAmount = subtotal * (discount.discount_value / 100)
      } else {
        discountAmount = discount.discount_value
      }

      // Ensure discount doesn't exceed subtotal
      discountAmount = Math.min(discountAmount, subtotal)
    } else if (discountCode) {
      throw new Error('Invalid discount code')
    }
  }

  const totalAmount = subtotal - discountAmount

  // Generate confirmation code
  let confirmationCode: string
  const { data: confirmationCodeData, error: codeError } = await supabase
    .rpc('generate_confirmation_code')

  if (codeError || !confirmationCodeData) {
    // Fallback to JavaScript generation if RPC fails
    const { generateConfirmationCode } = await import('@/lib/utils/confirmation-code')
    let attempts = 0
    const maxAttempts = 10
    
    do {
      confirmationCode = generateConfirmationCode()
      const { data: existing } = await supabase
        .from('orders')
        .select('id')
        .eq('confirmation_code', confirmationCode)
        .limit(1)
        .maybeSingle()
      
      if (!existing) {
        break
      }
      attempts++
    } while (attempts < maxAttempts)
    
    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique confirmation code')
    }
  } else {
    confirmationCode = confirmationCodeData as string
  }

  // Set expiration (30 minutes from now)
  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + 30)

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      restaurant_id: restaurantId,
      table_id: tableId,
      confirmation_code: confirmationCode,
      status: 'awaiting_cashier_confirmation',
      subtotal,
      discount_amount: discountAmount,
      total_amount: totalAmount,
      expires_at: expiresAt.toISOString(),
      customer_session_id: customerSessionId || null,
      customer_name: customerName || null,
      idempotency_key: idempotencyKey || null,
    })
    .select()
    .single()

  if (orderError) {
    // If this request already succeeded with the same idempotency key, return it.
    if (idempotencyKey && orderError.code === '23505') {
      const { data: existingByKey } = await supabase
        .from('orders')
        .select(`
          *,
          tables (*),
          order_items (
            *,
            menu_items (*)
          )
        `)
        .eq('restaurant_id', restaurantId)
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()

      if (existingByKey) {
        return existingByKey
      }
    }

    throw new Error(`Failed to create order: ${orderError.message}`)
  }

  // Create order items
  const orderItems = items.map(item => ({
    order_id: order.id,
    menu_item_id: item.menu_item_id,
    quantity: item.quantity,
    price: item.price,
  }))

  const { error: orderItemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (orderItemsError) {
    // Rollback order creation
    await supabase.from('orders').delete().eq('id', order.id)
    throw new Error(`Failed to create order items: ${orderItemsError.message}`)
  }

  // Create order discount record if applicable
  if (discountCodeId) {
    await supabase
      .from('order_discounts')
      .insert({
        order_id: order.id,
        discount_code_id: discountCodeId,
        discount_amount: discountAmount,
      })
  }

  // Get table number and restaurant slug for revalidation
  const { data: tableAndRestaurantData } = await supabase
    .from('tables')
    .select('table_number, restaurants(slug)')
    .eq('id', tableId)
    .single()
  
  if (tableAndRestaurantData) {
    const slug = (tableAndRestaurantData.restaurants as any)?.slug
    const tableNumber = tableAndRestaurantData.table_number
    if (slug && tableNumber) {
      revalidatePath(`/${slug}/table/${tableNumber}/order`)
      revalidatePath(`/${slug}/table/${tableNumber}/orders/${order.id}/${order.status}`)
    }
  }
  revalidatePath('/admin')
  return order
}

export async function verifyOrderByCode(confirmationCode: string) {
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

  if (error) {
    return null
  }

  return data
}

export async function updateOrderStatus(
  restaurantSlug: string,
  orderId: string,
  status: 'confirmed' | 'completed' | 'cancelled',
  options?: {
    cancelledReason?: string
    actorId?: string
    cashReceived?: number
    changeAmount?: number
  }
) {
  const supabase = await createClient()

  // Verify restaurant exists and get its ID
  const restaurant = await getRestaurantBySlug(restaurantSlug)
  if (!restaurant) {
    throw new Error('Restaurant not found')
  }

  // Fetch order and verify it belongs to this restaurant
  const { data: existingOrder, error: fetchError } = await supabase
    .from('orders')
    .select('id, restaurant_id')
    .eq('id', orderId)
    .single()

  if (fetchError || !existingOrder) {
    throw new Error('Order not found')
  }

  if (existingOrder.restaurant_id !== restaurant.id) {
    throw new Error('Order does not belong to this restaurant')
  }

  const updateData: {
    status: string
    completed_at?: string
    payment_verified_at?: string
    cancelled_reason?: string | null
  } = { status }
  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  }
  if (status === 'confirmed') {
    updateData.payment_verified_at = new Date().toISOString()
  }
  if (status === 'cancelled') {
    updateData.cancelled_reason = options?.cancelledReason?.trim() || null
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .eq('restaurant_id', restaurant.id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update order: ${error.message}`)
  }

  await writeAuditLog({
    restaurantId: restaurant.id,
    action: `order.status.${status}`,
    entityType: 'order',
    entityId: orderId,
    actorType: 'cashier',
    actorId: options?.actorId,
    metadata: {
      previous_status: 'unknown',
      cancelled_reason: updateData.cancelled_reason || null,
      cash_received: options?.cashReceived ?? null,
      change_amount: options?.changeAmount ?? null,
    },
  })

  revalidatePath(`/${restaurantSlug}/cashier`)
  revalidatePath(`/${restaurantSlug}/table`)
  return data
}

export async function bulkUpdateOrderStatus(
  restaurantSlug: string,
  orderIds: string[],
  status: 'confirmed' | 'completed' | 'cancelled',
  options?: { cancelledReason?: string; actorId?: string }
) {
  if (orderIds.length === 0) {
    return { updatedCount: 0 }
  }

  const supabase = await createClient()
  const restaurant = await getRestaurantBySlug(restaurantSlug)

  if (!restaurant) {
    throw new Error('Restaurant not found')
  }

  const updateData: {
    status: string
    completed_at?: string
    payment_verified_at?: string
    cancelled_reason?: string | null
  } = { status }

  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  }
  if (status === 'confirmed') {
    updateData.payment_verified_at = new Date().toISOString()
  }
  if (status === 'cancelled') {
    updateData.cancelled_reason = options?.cancelledReason?.trim() || null
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('restaurant_id', restaurant.id)
    .in('id', orderIds)
    .select('id')

  if (error) {
    throw new Error(`Failed to bulk update orders: ${error.message}`)
  }

  await writeAuditLog({
    restaurantId: restaurant.id,
    action: `order.bulk_status.${status}`,
    entityType: 'order',
    actorType: 'cashier',
    actorId: options?.actorId,
    metadata: {
      order_ids: orderIds,
      cancelled_reason: updateData.cancelled_reason || null,
    },
  })

  revalidatePath(`/${restaurantSlug}/cashier`)
  revalidatePath(`/${restaurantSlug}/table`)

  return { updatedCount: data?.length || 0 }
}

export async function resendReceipt(restaurantSlug: string, orderId: string, actorId?: string) {
  const supabase = await createClient()
  const restaurant = await getRestaurantBySlug(restaurantSlug)

  if (!restaurant) {
    throw new Error('Restaurant not found')
  }

  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, receipt_resent_count')
    .eq('id', orderId)
    .eq('restaurant_id', restaurant.id)
    .single()

  if (fetchError || !order) {
    throw new Error('Order not found')
  }

  const nextResendCount = (order.receipt_resent_count || 0) + 1

  const { error: updateError } = await supabase
    .from('orders')
    .update({ receipt_resent_count: nextResendCount })
    .eq('id', orderId)
    .eq('restaurant_id', restaurant.id)

  if (updateError) {
    throw new Error(`Failed to resend receipt: ${updateError.message}`)
  }

  await writeAuditLog({
    restaurantId: restaurant.id,
    action: 'order.receipt.resent',
    entityType: 'order',
    entityId: orderId,
    actorType: 'cashier',
    actorId,
    metadata: { resent_count: nextResendCount },
  })

  revalidatePath(`/${restaurantSlug}/cashier`)
  return { resentCount: nextResendCount }
}

export async function getShiftHandoverSummary(restaurantSlug: string) {
  const supabase = await createClient()
  const restaurant = await getRestaurantBySlug(restaurantSlug)

  if (!restaurant) {
    throw new Error('Restaurant not found')
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, status, total_amount, table_id, created_at, expires_at')
    .eq('restaurant_id', restaurant.id)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  if (error) {
    throw new Error(`Failed to fetch shift summary: ${error.message}`)
  }

  const all = orders || []
  const activeStatuses = ['pending', 'awaiting_cashier_confirmation', 'confirmed']
  const activeOrders = all.filter(order => activeStatuses.includes(order.status))
  const unpaidOrders = all.filter(order => ['pending', 'awaiting_cashier_confirmation'].includes(order.status))
  const now = Date.now()

  const expiredPending = all.filter(order => {
    if (order.status !== 'pending' || !order.expires_at) return false
    return new Date(order.expires_at).getTime() < now
  }).length

  return {
    openTables: new Set(activeOrders.map(order => order.table_id)).size,
    unpaidTotal: unpaidOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
    unpaidCount: unpaidOrders.length,
    exceptions: {
      expiredPending,
      cancelledToday: all.filter(order => order.status === 'cancelled').length,
    },
  }
}

export async function getAllOrders(restaurantId?: string) {
  const supabase = await createClient()
  
  let query = supabase
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
    .order('created_at', { ascending: false })

  if (restaurantId) {
    query = query.eq('restaurant_id', restaurantId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`)
  }

  return data || []
}

export async function getOrdersByStatus(
  status: string,
  restaurantId?: string
) {
  const supabase = await createClient()
  
  let query = supabase
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
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (restaurantId) {
    query = query.eq('restaurant_id', restaurantId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`)
  }

  return data || []
}

// Helper functions for slug-based queries
export async function getAllOrdersByRestaurantSlug(restaurantSlug: string) {
  // Get restaurant to verify it exists and get its ID
  const restaurant = await getRestaurantBySlug(restaurantSlug)
  if (!restaurant) {
    return []
  }

  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      tables (*),
      order_items (
        *,
        menu_items (*)
      )
    `)
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`)
  }

  return data || []
}

export async function getOrdersByStatusAndRestaurantSlug(
  status: string,
  restaurantSlug: string
) {
  // Get restaurant to verify it exists and get its ID
  const restaurant = await getRestaurantBySlug(restaurantSlug)
  if (!restaurant) {
    return []
  }

  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      tables (*),
      order_items (
        *,
        menu_items (*)
      )
    `)
    .eq('status', status)
    .eq('restaurant_id', restaurant.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`)
  }

  return data || []
}

