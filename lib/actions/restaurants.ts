'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getRestaurant(restaurantId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', restaurantId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch restaurant: ${error.message}`)
  }

  return data
}

export async function updateRestaurant(
  restaurantId: string,
  updates: {
    name?: string
    description?: string | null
    cover_image_url?: string | null
    is_open?: boolean
    opening_hours?: string | null
    contact_number?: string | null
  }
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('restaurants')
    .update(updates)
    .eq('id', restaurantId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update restaurant: ${error.message}`)
  }

  revalidatePath('/admin/dashboard')
  revalidatePath('/table', 'layout')

  return data
}
