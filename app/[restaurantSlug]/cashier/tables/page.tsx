import { getTablesByRestaurantSlug } from '@/lib/actions/tables'
import { TablesManagementClient } from './tables-client'
import { notFound } from 'next/navigation'
import { getRestaurantBySlug } from '@/lib/actions/restaurants'

export default async function TablesPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>
}) {
  const { restaurantSlug } = await params

  const restaurant = await getRestaurantBySlug(restaurantSlug)
  if (!restaurant) {
    notFound()
  }
  
  const tables = await getTablesByRestaurantSlug(restaurantSlug)

  return <TablesManagementClient initialTables={tables} restaurantSlug={restaurantSlug} restaurantId={restaurant.id} />
}

