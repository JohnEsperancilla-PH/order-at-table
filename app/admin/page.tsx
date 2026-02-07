import { getAllOrders, getMenuItems } from '@/lib/actions/orders'
import { getTableByNumber } from '@/lib/actions/orders'
import { getAllTables } from '@/lib/actions/tables'
import { getSizesForMenuItems } from '@/lib/actions/sizes'
import { AdminDashboardClient } from './admin-client'

export default async function AdminPage() {
  const [orders, tables, menuItems] = await Promise.all([
    getAllOrders(),
    getAllTables(),
    getMenuItems('00000000-0000-0000-0000-000000000001', true), // Using seed restaurant ID
  ])

  // Load sizes for all menu items
  const menuItemIds = menuItems.map((item: any) => item.id)
  const sizesByMenuItem = await getSizesForMenuItems(menuItemIds)

  // Attach sizes to menu items
  const menuItemsWithSizes = menuItems.map((item: any) => ({
    ...item,
    sizes: sizesByMenuItem[item.id] || [],
  }))

  return <AdminDashboardClient initialOrders={orders} tables={tables} menuItems={menuItemsWithSizes} />
}

