import { getRestaurantBySlug } from '@/lib/actions/restaurants'
import { getAllOrdersByRestaurantSlug } from '@/lib/actions/orders'
import { getMenuItems } from '@/lib/actions/orders'
import { getTablesByRestaurantSlug } from '@/lib/actions/tables'
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

  const [orders, menuItems, tables] = await Promise.all([
    getAllOrdersByRestaurantSlug(restaurantSlug),
    getMenuItems(restaurant.id, false),
    getTablesByRestaurantSlug(restaurantSlug),
  ])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayOrders = orders.filter((o: any) => new Date(o.created_at) >= today)
  const pendingOrders = orders.filter((o: any) =>
    ['pending', 'awaiting_cashier_confirmation', 'confirmed', 'ready_for_pickup'].includes(o.status)
  )

  const counts = {
    totalOrders: orders.length,
    pendingOrders: pendingOrders.length,
    confirmedToday: todayOrders.filter((o: any) => o.status === 'confirmed').length,
    completedToday: todayOrders.filter((o: any) => o.status === 'completed').length,
    cancelledToday: todayOrders.filter((o: any) => o.status === 'cancelled').length,
    menuItems: menuItems.length,
    tables: tables.length,
  }

  return (
    <DashboardClient
      restaurant={{
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurantSlug,
        is_open: restaurant.is_open,
      }}
      counts={counts}
      recentOrders={orders.slice(0, 10)}
    />
  )
}
