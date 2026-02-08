import { getMenuCategoriesByRestaurantSlug } from '@/lib/actions/orders'
import { CategoriesManagementClient } from './categories-client'
import { notFound } from 'next/navigation'
import { getRestaurantBySlug } from '@/lib/actions/restaurants'

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>
}) {
  const { restaurantSlug } = await params

  const restaurant = await getRestaurantBySlug(restaurantSlug)
  if (!restaurant) {
    notFound()
  }

  const categories = await getMenuCategoriesByRestaurantSlug(restaurantSlug, true)

  return <CategoriesManagementClient initialCategories={categories} restaurantSlug={restaurantSlug} restaurantId={restaurant.id} />
}
