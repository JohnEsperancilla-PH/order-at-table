import { getMenuCategoriesByRestaurantSlug, getMenuItemsByRestaurantSlug } from '@/lib/actions/orders'
import { listModifierPresets } from '@/lib/actions/modifier-presets'
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
  
  const [categories, menuItems, initialModifierPresets] = await Promise.all([
    getMenuCategoriesByRestaurantSlug(restaurantSlug, true),
    getMenuItemsByRestaurantSlug(restaurantSlug, true),
    listModifierPresets(restaurant.id),
  ])

  return (
    <MenuManagementClient
      categories={categories}
      menuItems={menuItems}
      restaurantSlug={restaurantSlug}
      restaurantId={restaurant.id}
      initialModifierPresets={initialModifierPresets}
    />
  )
}

