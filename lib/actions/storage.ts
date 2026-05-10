'use server'

import { randomUUID } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'

const MAX_BYTES = 6 * 1024 * 1024

/**
 * Upload menu item image (service role — bypasses Storage RLS).
 * Expects `file` in FormData (e.g. compressed WebP from the client).
 */
export async function uploadMenuItemImage(restaurantId: string, formData: FormData) {
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    throw new Error('Image file is required')
  }
  if (file.size > MAX_BYTES) {
    throw new Error(`Image must be ${MAX_BYTES / 1024 / 1024}MB or smaller`)
  }

  const supabase = createServiceClient()
  const buffer = Buffer.from(await file.arrayBuffer())
  const path = `${restaurantId}/${Date.now()}-${randomUUID()}.webp`

  const { error } = await supabase.storage.from('menu-images').upload(path, buffer, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'image/webp',
  })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  const { data } = supabase.storage.from('menu-images').getPublicUrl(path)
  return data.publicUrl
}

/**
 * Upload restaurant cover image (service role — bypasses Storage RLS).
 */
export async function uploadRestaurantCoverImage(restaurantSlug: string, formData: FormData) {
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    throw new Error('Image file is required')
  }
  if (file.size > MAX_BYTES) {
    throw new Error(`Image must be ${MAX_BYTES / 1024 / 1024}MB or smaller`)
  }

  const supabase = createServiceClient()
  const buffer = Buffer.from(await file.arrayBuffer())
  const safeSlug = restaurantSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'restaurant'
  const path = `${safeSlug}/cover-${Date.now()}-${randomUUID()}.webp`

  const { error } = await supabase.storage.from('restaurant-images').upload(path, buffer, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'image/webp',
  })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  const { data } = supabase.storage.from('restaurant-images').getPublicUrl(path)
  return data.publicUrl
}
