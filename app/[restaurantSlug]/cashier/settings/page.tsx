import { notFound } from 'next/navigation'
import { getRestaurantBySlug } from '@/lib/actions/restaurants'
import { SettingsClient } from './settings-client'

export default async function CashierSettingsPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>
}) {
  const { restaurantSlug } = await params

  const restaurant = await getRestaurantBySlug(restaurantSlug)
  if (!restaurant) {
    notFound()
  }

  return <SettingsClient restaurant={restaurant} restaurantSlug={restaurantSlug} />
}
