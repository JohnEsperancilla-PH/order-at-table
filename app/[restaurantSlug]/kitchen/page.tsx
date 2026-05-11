import { getRestaurantBySlug } from '@/lib/actions/restaurants'
import { getOrdersByStatusAndRestaurantSlug } from '@/lib/actions/orders'
import { notFound } from 'next/navigation'
import { KitchenDashboardClient } from './kitchen-client'

export default async function KitchenPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>
}) {
  const { restaurantSlug } = await params

  // Verify restaurant exists
  const restaurant = await getRestaurantBySlug(restaurantSlug)
  if (!restaurant) {
    notFound()
  }

  // Fetch initial confirmed orders
  const orders = await getOrdersByStatusAndRestaurantSlug('confirmed', restaurantSlug)

  return (
    <KitchenDashboardClient 
      initialOrders={orders} 
      restaurantSlug={restaurantSlug} 
    />
  )
}
