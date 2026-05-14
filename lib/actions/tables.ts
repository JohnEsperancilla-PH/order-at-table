'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { getRestaurantBySlug } from './restaurants'

export async function getTableByNumber(tableNumber: string, restaurantId?: string) {
  const supabase = createServiceClient()
  
  let query = supabase
    .from('tables')
    .select('*, restaurants(*)')
    .eq('table_number', tableNumber)
    .eq('is_active', true)

  if (restaurantId) {
    query = query.eq('restaurant_id', restaurantId)
  }

  const { data, error } = await query.single()

  if (error) {
    throw new Error(`Table not found: ${error.message}`)
  }

  return data
}

export async function getAllTables(restaurantId?: string) {
  const supabase = createServiceClient()
  
  let query = supabase
    .from('tables')
    .select('*, restaurants(*)')
    .order('table_number', { ascending: true })

  if (restaurantId) {
    query = query.eq('restaurant_id', restaurantId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch tables: ${error.message}`)
  }

  return data || []
}

export async function getFirstTableNumbersByRestaurantIds(
  restaurantIds: string[]
): Promise<Record<string, string>> {
  if (restaurantIds.length === 0) return {}

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('tables')
    .select('restaurant_id, table_number')
    .in('restaurant_id', restaurantIds)
    .eq('is_active', true)
    .order('table_number', { ascending: true })

  if (error) return {}

  const result: Record<string, string> = {}
  for (const row of data || []) {
    if (!result[row.restaurant_id]) {
      result[row.restaurant_id] = String(row.table_number)
    }
  }
  return result
}

export async function getTablesByRestaurantSlug(restaurantSlug: string) {
  // Get restaurant to verify it exists and get its ID
  const restaurant = await getRestaurantBySlug(restaurantSlug)
  if (!restaurant) {
    return []
  }

  const supabase = createServiceClient()
  
  const { data, error } = await supabase
    .from('tables')
    .select('*, restaurants(*)')
    .eq('restaurant_id', restaurant.id)
    .order('table_number', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch tables: ${error.message}`)
  }

  return data || []
}

function generatePinCode(): string {
  return String(Math.floor(Math.random() * 10000)).padStart(4, '0')
}

export async function createTable(
  restaurantId: string,
  tableNumber: string,
  capacity?: number,
  pinCode?: string | null
) {
  const supabase = createServiceClient()

  // Check if table number already exists
  const { data: existing } = await supabase
    .from('tables')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .eq('table_number', tableNumber)
    .single()

  if (existing) {
    throw new Error('Table number already exists for this restaurant')
  }

  const pin = pinCode !== undefined ? pinCode : generatePinCode()

  const { data, error } = await supabase
    .from('tables')
    .insert({
      restaurant_id: restaurantId,
      table_number: tableNumber,
      capacity: capacity || null,
      is_active: true,
      pin_code: pin,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create table: ${error.message}`)
  }

  revalidatePath('/admin/tables')
  return data
}

export async function updateTable(
  tableId: string,
  updates: {
    table_number?: string
    capacity?: number
    is_active?: boolean
    pin_code?: string | null
  }
) {
  const supabase = createServiceClient()

  // If updating table_number, check for duplicates
  if (updates.table_number) {
    const { data: table } = await supabase
      .from('tables')
      .select('restaurant_id')
      .eq('id', tableId)
      .single()

    if (table) {
      const { data: existing } = await supabase
        .from('tables')
        .select('id')
        .eq('restaurant_id', table.restaurant_id)
        .eq('table_number', updates.table_number)
        .neq('id', tableId)
        .single()

      if (existing) {
        throw new Error('Table number already exists for this restaurant')
      }
    }
  }

  const { data, error } = await supabase
    .from('tables')
    .update(updates)
    .eq('id', tableId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update table: ${error.message}`)
  }

  revalidatePath('/admin/tables')
  return data
}

export async function deleteTable(tableId: string) {
  const supabase = createServiceClient()

  // Check if table has active orders
  const { data: activeOrders } = await supabase
    .from('orders')
    .select('id')
    .eq('table_id', tableId)
    .in('status', ['pending', 'awaiting_cashier_confirmation', 'confirmed'])
    .limit(1)

  if (activeOrders && activeOrders.length > 0) {
    throw new Error('Cannot delete table with active orders')
  }

  const { error } = await supabase
    .from('tables')
    .delete()
    .eq('id', tableId)

  if (error) {
    throw new Error(`Failed to delete table: ${error.message}`)
  }

  revalidatePath('/admin/tables')
}

export async function regenerateTablePin(tableId: string) {
  const supabase = createServiceClient()
  const pin = generatePinCode()

  const { data, error } = await supabase
    .from('tables')
    .update({ pin_code: pin })
    .eq('id', tableId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to regenerate PIN: ${error.message}`)
  }

  revalidatePath('/admin/tables')
  return data
}

export async function validateTablePin(tableId: string, pin: string) {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('tables')
    .select('id, pin_code')
    .eq('id', tableId)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return false
  }

  if (!data.pin_code) {
    return true
  }

  return data.pin_code === pin
}

