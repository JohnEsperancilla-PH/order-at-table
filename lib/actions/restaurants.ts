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

export async function getRestaurantBySlug(slug: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug.toLowerCase())
    .single()

  if (error) {
    return null
  }

  return data
}

export async function getAllRestaurants() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch restaurants: ${error.message}`)
  }

  return data
}

// Helper function to generate URL-safe slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
}

export async function createRestaurant(
  name: string,
  options?: {
    description?: string | null
    contact_number?: string | null
    opening_hours?: string | null
  }
) {
  const supabase = await createClient()
  const slug = generateSlug(name)

  const { data, error } = await supabase
    .from('restaurants')
    .insert({
      name,
      slug,
      description: options?.description || null,
      contact_number: options?.contact_number || null,
      opening_hours: options?.opening_hours || null,
      is_open: true,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create restaurant: ${error.message}`)
  }

  revalidatePath('/admin')
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/restaurants')

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

  revalidatePath('/admin')
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/restaurants')
  revalidatePath('/table', 'layout')

  return data
}
