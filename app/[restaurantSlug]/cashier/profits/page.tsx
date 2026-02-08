import { getAllOrdersByRestaurantSlug } from '@/lib/actions/orders'
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

  const orders = await getAllOrdersByRestaurantSlug(restaurantSlug)

  return <ProfitsClient initialOrders={orders} />
}
