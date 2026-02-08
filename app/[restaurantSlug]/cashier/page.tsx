import { getAllOrdersByRestaurantSlug, getMenuItemsByRestaurantSlug } from '@/lib/actions/orders'
import { getTablesByRestaurantSlug } from '@/lib/actions/tables'
import { getSizesForMenuItems } from '@/lib/actions/sizes'
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

  // Load sizes for all menu items
  const menuItemIds = menuItems.map((item: any) => item.id)
  const sizesByMenuItem = await getSizesForMenuItems(menuItemIds)

  // Attach sizes to menu items
  const menuItemsWithSizes = menuItems.map((item: any) => ({
    ...item,
    sizes: sizesByMenuItem[item.id] || [],
  }))

  return (
    <AdminDashboardClient 
      initialOrders={orders} 
      tables={tables} 
      menuItems={menuItemsWithSizes}
      restaurantSlug={restaurantSlug}
    />
  )
}

