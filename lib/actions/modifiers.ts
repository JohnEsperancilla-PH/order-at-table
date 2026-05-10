'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { getCachedModifiersByRestaurant } from '@/lib/cache/menu-catalog'
import { revalidateMenuCatalog } from '@/lib/cache/revalidate-menu-catalog'

const TABLE = 'menu_item_modifiers' as const

async function revalidateMenuCatalogForMenuItemId(menuItemId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('menu_items')
    .select('restaurant_id')
    .eq('id', menuItemId)
    .maybeSingle()
  if (data?.restaurant_id) {
    revalidateMenuCatalog(data.restaurant_id)
  }
}

async function revalidateMenuCatalogForModifierId(modifierId: string) {
  const supabase = createServiceClient()
  const { data: mod } = await supabase.from(TABLE).select('menu_item_id').eq('id', modifierId).maybeSingle()
  if (mod?.menu_item_id) {
    await revalidateMenuCatalogForMenuItemId(mod.menu_item_id)
  }
}

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

  await revalidateMenuCatalogForMenuItemId(menuItemId)
  if (restaurantSlug) {
    revalidatePath(`/${restaurantSlug}/cashier/menu`)
  }
  return data
}

/** Insert multiple modifiers in one round-trip (continues `display_order` after existing rows). */
export async function addMenuItemModifiersBatch(
  menuItemId: string,
  modifiers: Array<{ name: string; price_modifier: number }>,
  restaurantSlug?: string
) {
  const trimmed = modifiers
    .map(m => ({
      name: m.name.trim(),
      price_modifier: m.price_modifier,
    }))
    .filter(m => m.name.length > 0)

  if (trimmed.length === 0) {
    throw new Error('Add at least one modifier with a name')
  }

  const supabase = createServiceClient()

  const { data: existing } = await supabase
    .from(TABLE)
    .select('display_order')
    .eq('menu_item_id', menuItemId)
    .order('display_order', { ascending: false })
    .limit(1)

  let nextOrder = (existing?.[0]?.display_order ?? -1) + 1

  const rows = trimmed.map((m, i) => ({
    menu_item_id: menuItemId,
    name: m.name,
    price_modifier: m.price_modifier,
    display_order: nextOrder + i,
  }))

  const { data, error } = await supabase.from(TABLE).insert(rows).select()

  if (error) {
    throw new Error(`Failed to save modifiers: ${error.message}`)
  }

  await revalidateMenuCatalogForMenuItemId(menuItemId)
  if (restaurantSlug) {
    revalidatePath(`/${restaurantSlug}/cashier/menu`)
  }
  return data ?? []
}

export async function deleteMenuItemModifier(modifierId: string, restaurantSlug?: string) {
  const supabase = createServiceClient()

  await revalidateMenuCatalogForModifierId(modifierId)

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

/** Cached map of modifiers for every item under this restaurant. */
export async function getModifiersForRestaurant(restaurantId: string) {
  return getCachedModifiersByRestaurant(restaurantId)
}

export async function getModifiersForMenuItems(menuItemIds: string[]) {
  if (menuItemIds.length === 0) return {}

  const supabase = createServiceClient()
  const { data: anchor } = await supabase
    .from('menu_items')
    .select('restaurant_id')
    .eq('id', menuItemIds[0])
    .maybeSingle()

  if (!anchor?.restaurant_id) return {}

  const full = await getCachedModifiersByRestaurant(anchor.restaurant_id)
  const subset: Record<string, any[]> = {}
  menuItemIds.forEach(id => {
    subset[id] = full[id] ?? []
  })
  return subset
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

  await revalidateMenuCatalogForModifierId(modifierId)
  if (restaurantSlug) {
    revalidatePath(`/${restaurantSlug}/cashier/menu`)
  }
  return data
}
