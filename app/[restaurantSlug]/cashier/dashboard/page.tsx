import { getRestaurantBySlug } from '@/lib/actions/restaurants'
import { DashboardClient } from './dashboard-client'
import { notFound } from 'next/navigation'

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>
}) {
  const { restaurantSlug } = await params

  const restaurant = await getRestaurantBySlug(restaurantSlug)
  if (!restaurant) {
    notFound()
  }

  return <DashboardClient initialRestaurant={restaurant} restaurantSlug={restaurantSlug} />
}
