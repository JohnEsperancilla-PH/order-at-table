'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export type ModifierPreset = {
  id: string
  restaurant_id: string
  name: string
  price_modifier: number
  display_order: number
  created_at?: string
  updated_at?: string
}

const TABLE = 'modifier_presets' as const

export async function listModifierPresets(restaurantId: string): Promise<ModifierPreset[]> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('display_order', { ascending: true })

  if (error) {
    throw new Error(`Failed to load default modifiers: ${error.message}`)
  }

  return (data || []) as ModifierPreset[]
}

export async function createModifierPreset(
  restaurantId: string,
  input: { name: string; price_modifier: number },
  restaurantSlug?: string
): Promise<ModifierPreset> {
  const name = input.name.trim()
  if (!name) {
    throw new Error('Name is required')
  }

  const supabase = createServiceClient()

  const { data: existing } = await supabase
    .from(TABLE)
    .select('display_order')
    .eq('restaurant_id', restaurantId)
    .order('display_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.display_order ?? -1) + 1

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      restaurant_id: restaurantId,
      name,
      price_modifier: input.price_modifier,
      display_order: nextOrder,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create default modifier: ${error.message}`)
  }

  if (restaurantSlug) {
    revalidatePath(`/${restaurantSlug}/cashier/menu`)
  }
  return data as ModifierPreset
}

export async function updateModifierPreset(
  presetId: string,
  updates: { name?: string; price_modifier?: number },
  restaurantSlug?: string
): Promise<ModifierPreset> {
  const supabase = createServiceClient()

  const patch: Record<string, unknown> = {}
  if (updates.name !== undefined) {
    const n = updates.name.trim()
    if (!n) throw new Error('Name is required')
    patch.name = n
  }
  if (updates.price_modifier !== undefined) {
    patch.price_modifier = updates.price_modifier
  }

  const { data, error } = await supabase.from(TABLE).update(patch).eq('id', presetId).select().single()

  if (error) {
    throw new Error(`Failed to update default modifier: ${error.message}`)
  }

  if (restaurantSlug) {
    revalidatePath(`/${restaurantSlug}/cashier/menu`)
  }
  return data as ModifierPreset
}

export async function deleteModifierPreset(presetId: string, restaurantSlug?: string) {
  const supabase = createServiceClient()

  const { error } = await supabase.from(TABLE).delete().eq('id', presetId)

  if (error) {
    throw new Error(`Failed to delete default modifier: ${error.message}`)
  }

  if (restaurantSlug) {
    revalidatePath(`/${restaurantSlug}/cashier/menu`)
  }
}
