import { getMenuCategoriesByRestaurantSlug, getMenuItemsByRestaurantSlug } from '@/lib/actions/orders'
import { MenuManagementClient } from './menu-client'
import { notFound } from 'next/navigation'
import { getRestaurantBySlug } from '@/lib/actions/restaurants'

export default async function MenuManagementPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>
}) {
  const { restaurantSlug } = await params

  const restaurant = await getRestaurantBySlug(restaurantSlug)
  if (!restaurant) {
    notFound()
  }
  
  const [categories, menuItems] = await Promise.all([
    getMenuCategoriesByRestaurantSlug(restaurantSlug, true),
    getMenuItemsByRestaurantSlug(restaurantSlug, true),
  ])

  return <MenuManagementClient categories={categories} menuItems={menuItems} restaurantSlug={restaurantSlug} restaurantId={restaurant.id} />
}

