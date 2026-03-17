import { redirect } from 'next/navigation'
import { getAllRestaurants } from '@/lib/actions/restaurants'
import { getFirstTableNumbersByRestaurantIds } from '@/lib/actions/tables'
import { getSession } from '@/lib/actions/auth'
import { RestaurantsClient } from './restaurants-client'

export default async function AdminRestaurantsPage() {
  const session = await getSession()

  if (!session) {
    redirect('/admin/login')
  }

  const restaurants = await getAllRestaurants()
  const firstTableByRestaurantId = await getFirstTableNumbersByRestaurantIds(
    restaurants.map((r) => r.id)
  )

  return (
    <RestaurantsClient
      initialRestaurants={restaurants}
      firstTableByRestaurantId={firstTableByRestaurantId}
    />
  )
}
