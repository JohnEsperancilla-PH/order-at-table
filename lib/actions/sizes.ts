'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addSize(
  menuItemId: string,
  size: {
    name: string
    price_modifier: number
  },
  restaurantSlug?: string
) {
  const supabase = await createClient()

  const { data: existingSizes } = await supabase
    .from('sizes')
    .select('display_order')
    .eq('menu_item_id', menuItemId)
    .order('display_order', { ascending: false })
    .limit(1)

  const nextOrder = (existingSizes?.[0]?.display_order ?? -1) + 1

  const { data, error } = await supabase
    .from('sizes')
    .insert({
      menu_item_id: menuItemId,
      name: size.name,
      price_modifier: size.price_modifier,
      display_order: nextOrder,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to add size: ${error.message}`)
  }

  if (restaurantSlug) {
    revalidatePath(`/${restaurantSlug}/cashier/menu`)
  }
  return data
}

export async function deleteSize(sizeId: string, restaurantSlug?: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sizes')
    .delete()
    .eq('id', sizeId)

  if (error) {
    throw new Error(`Failed to delete size: ${error.message}`)
  }

  if (restaurantSlug) {
    revalidatePath(`/${restaurantSlug}/cashier/menu`)
  }
}

export async function getSizesForMenuItem(menuItemId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sizes')
    .select('*')
    .eq('menu_item_id', menuItemId)
    .order('display_order')

  if (error) {
    throw new Error(`Failed to fetch sizes: ${error.message}`)
  }

  return data || []
}

export async function getSizesForMenuItems(menuItemIds: string[]) {
  if (menuItemIds.length === 0) return {}

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sizes')
    .select('*')
    .in('menu_item_id', menuItemIds)
    .order('display_order')

  if (error) {
    throw new Error(`Failed to fetch sizes: ${error.message}`)
  }

  // Group sizes by menu_item_id
  const sizesByMenuItem: Record<string, any[]> = {}
  menuItemIds.forEach(id => {
    sizesByMenuItem[id] = []
  })

  data?.forEach(size => {
    if (sizesByMenuItem[size.menu_item_id]) {
      sizesByMenuItem[size.menu_item_id].push(size)
    }
  })

  return sizesByMenuItem
}

export async function updateSize(
  sizeId: string,
  updates: {
    name?: string
    price_modifier?: number
  },
  restaurantSlug?: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sizes')
    .update(updates)
    .eq('id', sizeId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update size: ${error.message}`)
  }

  if (restaurantSlug) {
    revalidatePath(`/${restaurantSlug}/cashier/menu`)
  }
  return data
}
