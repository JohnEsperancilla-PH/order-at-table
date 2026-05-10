import { getAllOrdersByRestaurantSlug, getMenuItemsByRestaurantSlug } from '@/lib/actions/orders'
import { getTablesByRestaurantSlug } from '@/lib/actions/tables'
import { getModifiersForMenuItems } from '@/lib/actions/modifiers'
import { getRestaurantBySlug } from '@/lib/actions/restaurants'
import { AdminDashboardClient } from './admin-client'
import { notFound } from 'next/navigation'

export default async function CashierPage({
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

  const [orders, tables, menuItems] = await Promise.all([
    getAllOrdersByRestaurantSlug(restaurantSlug),
    getTablesByRestaurantSlug(restaurantSlug),
    getMenuItemsByRestaurantSlug(restaurantSlug, true),
  ])

  const menuItemIds = menuItems.map((item: any) => item.id)
  const modifiersByMenuItem = await getModifiersForMenuItems(menuItemIds)

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

