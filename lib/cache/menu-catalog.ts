import { unstable_cache } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'

/** Default edge cache / max stale window; mutations use revalidateTag for immediate bust. */
export const MENU_CATALOG_CACHE_SECONDS = 300

export function menuCatalogTag(restaurantId: string) {
  return `menu-catalog:${restaurantId}`
}

async function loadMenuCategories(restaurantId: string, includeInactive: boolean) {
  const supabase = createServiceClient()

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

async function loadMenuItems(restaurantId: string, includeUnavailable: boolean) {
  const supabase = createServiceClient()

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

async function loadModifiersGrouped(restaurantId: string) {
  const supabase = createServiceClient()

  const { data: items, error: itemsError } = await supabase
    .from('menu_items')
    .select('id')
    .eq('restaurant_id', restaurantId)

  if (itemsError) {
    throw new Error(`Failed to fetch menu item ids: ${itemsError.message}`)
  }

  const ids = (items ?? []).map(r => r.id)
  if (ids.length === 0) {
    return {} as Record<string, any[]>
  }

  const { data, error } = await supabase
    .from('menu_item_modifiers')
    .select('*')
    .in('menu_item_id', ids)
    .order('display_order')

  if (error) {
    throw new Error(`Failed to fetch modifiers: ${error.message}`)
  }

  const byMenuItem: Record<string, any[]> = {}
  ids.forEach(id => {
    byMenuItem[id] = []
  })
  data?.forEach(row => {
    if (byMenuItem[row.menu_item_id]) {
      byMenuItem[row.menu_item_id].push(row)
    }
  })

  return byMenuItem
}

export async function getCachedMenuCategories(restaurantId: string, includeInactive = false) {
  return unstable_cache(
    async () => loadMenuCategories(restaurantId, includeInactive),
    ['menu_categories', restaurantId, includeInactive ? 'all' : 'active'],
    { tags: [menuCatalogTag(restaurantId)], revalidate: MENU_CATALOG_CACHE_SECONDS }
  )()
}

export async function getCachedMenuItems(restaurantId: string, includeUnavailable = false) {
  return unstable_cache(
    async () => loadMenuItems(restaurantId, includeUnavailable),
    ['menu_items', restaurantId, includeUnavailable ? 'all' : 'available'],
    { tags: [menuCatalogTag(restaurantId)], revalidate: MENU_CATALOG_CACHE_SECONDS }
  )()
}

export async function getCachedModifiersByRestaurant(restaurantId: string) {
  return unstable_cache(
    async () => loadModifiersGrouped(restaurantId),
    ['menu_item_modifiers', restaurantId],
    { tags: [menuCatalogTag(restaurantId)], revalidate: MENU_CATALOG_CACHE_SECONDS }
  )()
}
