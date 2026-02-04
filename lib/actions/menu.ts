'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleMenuItemAvailability(
  menuItemId: string,
  isAvailable: boolean
) {
  const supabase = await createClient()

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

  revalidatePath('/admin')
  return data
}

