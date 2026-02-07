import { getRestaurant } from '@/lib/actions/restaurants'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const restaurantId = '00000000-0000-0000-0000-000000000001'

  const restaurant = await getRestaurant(restaurantId)

  return <DashboardClient initialRestaurant={restaurant} restaurantId={restaurantId} />
}
