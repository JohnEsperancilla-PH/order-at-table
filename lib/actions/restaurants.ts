'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/actions/auth'

export async function getRestaurant(restaurantId: string) {
  const supabase = createServiceClient()

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
  const supabase = createServiceClient()

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
  const supabase = createServiceClient()

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
    latitude?: number | null
    longitude?: number | null
    geofence_radius_meters?: number | null
    geofence_enabled?: boolean
  }
) {
  const supabase = createServiceClient()
  const slug = generateSlug(name)

  const { data, error } = await supabase
    .from('restaurants')
    .insert({
      name,
      slug,
      description: options?.description || null,
      contact_number: options?.contact_number || null,
      opening_hours: options?.opening_hours || null,
      latitude: options?.latitude || null,
      longitude: options?.longitude || null,
      geofence_radius_meters: options?.geofence_radius_meters || 100,
      geofence_enabled: options?.geofence_enabled || false,
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
    service_charge_rate?: number
    tax_rate?: number
    tax_mode?: 'inclusive' | 'exclusive'
    kitchen_cutoff_time?: string | null
    latitude?: number | null
    longitude?: number | null
    geofence_radius_meters?: number | null
    geofence_enabled?: boolean
  }
) {
  const supabase = createServiceClient()

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

export async function deleteRestaurant(restaurantId: string) {
  const session = await getSession()
  if (!session) {
    throw new Error('You must be signed in to delete a restaurant')
  }

  const supabase = createServiceClient()

  const { data: existing, error: fetchError } = await supabase
    .from('restaurants')
    .select('id, slug')
    .eq('id', restaurantId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(`Failed to look up restaurant: ${fetchError.message}`)
  }
  if (!existing) {
    throw new Error('Restaurant not found')
  }

  // Remove orders first so order_items disappear before menu_items CASCADE runs.
  // Otherwise FK order_items_menu_item_id_fkey (ON DELETE RESTRICT) blocks menu_items deletes.
  const { error: ordersError } = await supabase
    .from('orders')
    .delete()
    .eq('restaurant_id', restaurantId)

  if (ordersError) {
    throw new Error(`Failed to delete restaurant orders: ${ordersError.message}`)
  }

  const { error } = await supabase.from('restaurants').delete().eq('id', restaurantId)

  if (error) {
    throw new Error(`Failed to delete restaurant: ${error.message}`)
  }

  revalidatePath('/admin')
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/restaurants')
  revalidatePath('/admin/restaurants/accounts')
  revalidatePath(`/${existing.slug}`, 'layout')
  revalidatePath(`/${existing.slug}/cashier`, 'layout')
  revalidatePath(`/${existing.slug}/table`, 'layout')

  return { ok: true as const }
}

export async function toggleRestaurantFeature(
  restaurantId: string,
  feature: string,
  enabled: boolean
) {
  const supabase = createServiceClient()

  const { data: current, error: fetchError } = await supabase
    .from('restaurants')
    .select('subscription_features')
    .eq('id', restaurantId)
    .single()

  if (fetchError) {
    throw new Error(`Failed to fetch restaurant: ${fetchError.message}`)
  }

  const features = { ...(current?.subscription_features || {}) }
  features[feature] = enabled

  const { data, error } = await supabase
    .from('restaurants')
    .update({ subscription_features: features })
    .eq('id', restaurantId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update feature: ${error.message}`)
  }

  revalidatePath('/admin')
  revalidatePath('/admin/restaurants')
  revalidatePath(`/${data.slug}`, 'layout')

  return data
}
