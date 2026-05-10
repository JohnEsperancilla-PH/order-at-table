'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'
import { hash, compare } from 'bcryptjs'

export async function createStaffAccount(
  restaurantId: string,
  email: string,
  password: string,
  name: string,
  role: 'owner' | 'manager' | 'staff' = 'staff'
) {
  const supabase = createServiceClient()

  // Check if email already exists for this restaurant
  const { data: existing } = await supabase
    .from('staff_accounts')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .eq('email', email.toLowerCase())
    .single()

  if (existing) {
    throw new Error('Email already exists for this restaurant')
  }

  // Hash password
  const passwordHash = await hash(password, 10)

  const { data, error } = await supabase
    .from('staff_accounts')
    .insert({
      restaurant_id: restaurantId,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      name,
      role,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create staff account: ${error.message}`)
  }

  revalidatePath('/admin')
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/restaurants')
  revalidatePath('/admin/restaurants/accounts')
  return {
    ...data,
    password_hash: undefined, // Don't return password hash
  }
}

export async function loginStaffAccount(restaurantSlug: string, email: string, password: string) {
  const supabase = createServiceClient()

  // Run both queries in parallel instead of sequentially
  const [restaurantResult, accountBySlugResult] = await Promise.all([
    supabase
      .from('restaurants')
      .select('id')
      .eq('slug', restaurantSlug.toLowerCase())
      .single(),
    supabase
      .from('staff_accounts')
      .select('id, email, password_hash, name, role, restaurant_id')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single(),
  ])

  const { data: restaurant, error: restaurantError } = restaurantResult
  const { data: account, error: accountError } = accountBySlugResult

  if (restaurantError || !restaurant) {
    throw new Error('Restaurant not found')
  }

  if (accountError || !account) {
    throw new Error('Invalid email or password')
  }

  // Verify restaurant matches
  if (account.restaurant_id !== restaurant.id) {
    throw new Error('Invalid email or password')
  }

  // Verify password
  const isPasswordValid = await compare(password, account.password_hash)
  if (!isPasswordValid) {
    throw new Error('Invalid email or password')
  }

  // Return account without password hash
  return {
    id: account.id,
    restaurantId: account.restaurant_id,
    email: account.email,
    name: account.name,
    role: account.role,
  }
}

export async function getAllStaffAccountsForPlatformAdmin() {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('staff_accounts')
    .select(`
      id,
      email,
      name,
      role,
      is_active,
      created_at,
      restaurants (
        id,
        name,
        slug
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch staff accounts: ${error.message}`)
  }

  return (data || []).map((row: any) => {
    const { restaurants, ...rest } = row
    const restaurant = Array.isArray(restaurants) ? restaurants[0] : restaurants
    return { ...rest, restaurant }
  })
}

export async function getStaffAccountsByRestaurant(restaurantId: string) {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('staff_accounts')
    .select('id, email, name, role, is_active, created_at')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch staff accounts: ${error.message}`)
  }

  return data || []
}

export async function deleteStaffAccount(accountId: string) {
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('staff_accounts')
    .delete()
    .eq('id', accountId)

  if (error) {
    throw new Error(`Failed to delete staff account: ${error.message}`)
  }

  revalidatePath('/admin')
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/restaurants')
  revalidatePath('/admin/restaurants/accounts')
}

export async function updateStaffAccount(
  accountId: string,
  updates: {
    name?: string
    role?: 'owner' | 'manager' | 'staff'
    is_active?: boolean
  }
) {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('staff_accounts')
    .update(updates)
    .eq('id', accountId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update staff account: ${error.message}`)
  }

  revalidatePath('/admin')
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/restaurants')
  revalidatePath('/admin/restaurants/accounts')
  return data
}
