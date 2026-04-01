import { getAllOrdersByRestaurantSlug, getMenuItemsByRestaurantSlug } from '@/lib/actions/orders'
import { ProfitsClient } from './profits-client'
import { notFound } from 'next/navigation'
import { getRestaurantBySlug } from '@/lib/actions/restaurants'

export default async function ProfitsPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>
}) {
  const { restaurantSlug } = await params

  const restaurant = await getRestaurantBySlug(restaurantSlug)
  if (!restaurant) {
    notFound()
  }

  const [orders, menuItems] = await Promise.all([
    getAllOrdersByRestaurantSlug(restaurantSlug),
    getMenuItemsByRestaurantSlug(restaurantSlug, true),
  ])

  return <ProfitsClient initialOrders={orders} menuItems={menuItems} />
}
