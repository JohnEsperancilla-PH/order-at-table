import { getMenuCategories, getMenuItems } from '@/lib/actions/orders'
import { MenuManagementClient } from './menu-client'

export default async function MenuManagementPage() {
  // For now, using the first restaurant. In production, you'd get this from auth/session
  const restaurantId = '00000000-0000-0000-0000-000000000001'
  
  const [categories, menuItems] = await Promise.all([
    getMenuCategories(restaurantId),
    getMenuItems(restaurantId),
  ])

  return <MenuManagementClient categories={categories} menuItems={menuItems} />
}

