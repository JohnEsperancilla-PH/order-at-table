'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

const TABLE = 'menu_item_modifiers' as const

export async function addMenuItemModifier(
  menuItemId: string,
  modifier: {
    name: string
    price_modifier: number
  },
  restaurantSlug?: string
) {
  const supabase = createServiceClient()

  const { data: existing } = await supabase
    .from(TABLE)
    .select('display_order')
    .eq('menu_item_id', menuItemId)
    .order('display_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.display_order ?? -1) + 1

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      menu_item_id: menuItemId,
      name: modifier.name,
      price_modifier: modifier.price_modifier,
      display_order: nextOrder,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to add modifier: ${error.message}`)
  }

  if (restaurantSlug) {
    revalidatePath(`/${restaurantSlug}/cashier/menu`)
  }
  return data
}

export async function deleteMenuItemModifier(modifierId: string, restaurantSlug?: string) {
  const supabase = createServiceClient()

  const { error } = await supabase.from(TABLE).delete().eq('id', modifierId)

  if (error) {
    throw new Error(`Failed to delete modifier: ${error.message}`)
  }

  if (restaurantSlug) {
    revalidatePath(`/${restaurantSlug}/cashier/menu`)
  }
}

export async function getModifiersForMenuItem(menuItemId: string) {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('menu_item_id', menuItemId)
    .order('display_order')

  if (error) {
    throw new Error(`Failed to fetch modifiers: ${error.message}`)
  }

  return data || []
}

export async function getModifiersForMenuItems(menuItemIds: string[]) {
  if (menuItemIds.length === 0) return {}

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .in('menu_item_id', menuItemIds)
    .order('display_order')

  if (error) {
    throw new Error(`Failed to fetch modifiers: ${error.message}`)
  }

  const byMenuItem: Record<string, any[]> = {}
  menuItemIds.forEach(id => {
    byMenuItem[id] = []
  })

  data?.forEach(row => {
    if (byMenuItem[row.menu_item_id]) {
      byMenuItem[row.menu_item_id].push(row)
    }
  })

  return byMenuItem
}

export async function updateMenuItemModifier(
  modifierId: string,
  updates: {
    name?: string
    price_modifier?: number
  },
  restaurantSlug?: string
) {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq('id', modifierId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update modifier: ${error.message}`)
  }

  if (restaurantSlug) {
    revalidatePath(`/${restaurantSlug}/cashier/menu`)
  }
  return data
}
