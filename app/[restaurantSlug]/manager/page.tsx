import { getAllOrdersByRestaurantSlug, getMenuItemsByRestaurantSlug } from '@/lib/actions/orders'
import { getTablesByRestaurantSlug } from '@/lib/actions/tables'
import { getModifiersForRestaurant } from '@/lib/actions/modifiers'
import { getRestaurantBySlug } from '@/lib/actions/restaurants'
import { AdminDashboardClient } from '@/app/[restaurantSlug]/cashier/admin-client'
import { notFound } from 'next/navigation'

export default async function ManagerOrdersPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>
}) {
  const { restaurantSlug } = await params

  const restaurant = await getRestaurantBySlug(restaurantSlug)
  if (!restaurant) notFound()

  const [orders, tables, menuItems] = await Promise.all([
    getAllOrdersByRestaurantSlug(restaurantSlug),
    getTablesByRestaurantSlug(restaurantSlug),
    getMenuItemsByRestaurantSlug(restaurantSlug, true),
  ])

  const modifiersByMenuItem = await getModifiersForRestaurant(restaurant.id)
  const menuItemsWithModifiers = menuItems.map((item: any) => ({
    ...item,
    modifiers: modifiersByMenuItem[item.id] || [],
  }))

  return (
    <AdminDashboardClient
      initialOrders={orders}
      tables={tables}
      menuItems={menuItemsWithModifiers}
      restaurantSlug={restaurantSlug}
    />
  )
}
