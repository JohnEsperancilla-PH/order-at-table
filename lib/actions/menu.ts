'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { revalidateMenuCatalog } from '@/lib/cache/revalidate-menu-catalog'

export async function toggleMenuItemAvailability(
  menuItemId: string,
  isAvailable: boolean,
  restaurantSlug?: string
) {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('menu_items')
    .update({ is_available: isAvailable })
    .eq('id', menuItemId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update menu item: ${error.message}`)
  }

  // Update inventory as well
  await supabase
    .from('inventory')
    .upsert({
      menu_item_id: menuItemId,
      is_available: isAvailable,
    })

  if (restaurantSlug) {
    revalidatePath(`/${restaurantSlug}/cashier/menu`)
  }
  revalidatePath('/admin/dashboard')
  if (data?.restaurant_id) {
    revalidateMenuCatalog(data.restaurant_id)
  }
  return data
}

export async function createMenuItem(
  restaurantId: string,
  data: {
    name: string
    description?: string | null
    price: number
    category_id: string
    is_available?: boolean
    image_url?: string | null
  },
  restaurantSlug?: string
) {
  const supabase = createServiceClient()

  const { data: lastItem } = await supabase
    .from('menu_items')
    .select('display_order')
    .eq('restaurant_id', restaurantId)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const displayOrder = (lastItem?.display_order ?? 0) + 1

  const { data: createdItem, error } = await supabase
    .from('menu_items')
    .insert({
      restaurant_id: restaurantId,
      name: data.name,
      description: data.description || null,
      price: data.price,
      category_id: data.category_id,
      is_available: data.is_available ?? true,
      image_url: data.image_url || null,
      display_order: displayOrder,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create menu item: ${error.message}`)
  }

  if (restaurantSlug) {
    revalidatePath(`/${restaurantSlug}/cashier/menu`)
  }
  revalidatePath('/admin/dashboard')
  revalidateMenuCatalog(restaurantId)
  return createdItem
}

export async function updateMenuItem(
  menuItemId: string,
  updates: {
    name?: string
    description?: string | null
    price?: number
    category_id?: string
    is_available?: boolean
    image_url?: string | null
  },
  restaurantSlug?: string
) {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('menu_items')
    .update(updates)
    .eq('id', menuItemId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update menu item: ${error.message}`)
  }

  if (restaurantSlug) {
    revalidatePath(`/${restaurantSlug}/cashier/menu`)
  }
  revalidatePath('/admin/dashboard')
  if (data?.restaurant_id) {
    revalidateMenuCatalog(data.restaurant_id)
  }
  return data
}

export async function deleteMenuItem(menuItemId: string, restaurantSlug?: string) {
  const supabase = createServiceClient()

  const { data: row } = await supabase
    .from('menu_items')
    .select('restaurant_id')
    .eq('id', menuItemId)
    .maybeSingle()

  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', menuItemId)

  if (error) {
    throw new Error(`Failed to delete menu item: ${error.message}`)
  }

  if (restaurantSlug) {
    revalidatePath(`/${restaurantSlug}/cashier/menu`)
  }
  revalidatePath('/admin/dashboard')
  if (row?.restaurant_id) {
    revalidateMenuCatalog(row.restaurant_id)
  }
}

export async function createMenuCategory(
  restaurantId: string,
  name: string,
  description?: string | null,
  restaurantSlug?: string
) {
  const supabase = createServiceClient()

  const { data: lastCategory } = await supabase
    .from('menu_categories')
    .select('display_order')
    .eq('restaurant_id', restaurantId)
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const displayOrder = (lastCategory?.display_order ?? 0) + 1

  const { data, error } = await supabase
    .from('menu_categories')
    .insert({
      restaurant_id: restaurantId,
      name,
      description: description || null,
      display_order: displayOrder,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create category: ${error.message}`)
  }

  if (restaurantSlug) {
    revalidatePath(`/${restaurantSlug}/cashier/menu`)
  }
  revalidatePath('/admin/dashboard')
  revalidateMenuCatalog(restaurantId)
  return data
}

export async function updateMenuCategory(
  categoryId: string,
  updates: { name?: string; description?: string | null; is_active?: boolean },
  restaurantSlug?: string
) {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('menu_categories')
    .update(updates)
    .eq('id', categoryId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update category: ${error.message}`)
  }

  if (restaurantSlug) {
    revalidatePath(`/${restaurantSlug}/cashier/menu`)
  }
  revalidatePath('/admin/dashboard')
  if (data?.restaurant_id) {
    revalidateMenuCatalog(data.restaurant_id)
  }
  return data
}

export async function toggleMenuCategoryActive(
  categoryId: string,
  isActive: boolean,
  restaurantSlug?: string
) {
  return updateMenuCategory(categoryId, { is_active: isActive }, restaurantSlug)
}

export async function deleteMenuCategory(categoryId: string, restaurantSlug?: string) {
  const supabase = createServiceClient()

  const { data: categoryRow } = await supabase
    .from('menu_categories')
    .select('restaurant_id')
    .eq('id', categoryId)
    .maybeSingle()

  const { data: existingItems } = await supabase
    .from('menu_items')
    .select('id')
    .eq('category_id', categoryId)
    .limit(1)

  if (existingItems && existingItems.length > 0) {
    throw new Error('Cannot delete a category with menu items')
  }

  const { error } = await supabase
    .from('menu_categories')
    .delete()
    .eq('id', categoryId)

  if (error) {
    throw new Error(`Failed to delete category: ${error.message}`)
  }

  if (restaurantSlug) {
    revalidatePath(`/${restaurantSlug}/cashier/menu`)
  }
  revalidatePath('/admin/dashboard')
  if (categoryRow?.restaurant_id) {
    revalidateMenuCatalog(categoryRow.restaurant_id)
  }
}

