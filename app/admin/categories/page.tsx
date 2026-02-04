import { getMenuCategories } from '@/lib/actions/orders'
import { CategoriesManagementClient } from './categories-client'

export default async function CategoriesPage() {
  const restaurantId = '00000000-0000-0000-0000-000000000001'

  const categories = await getMenuCategories(restaurantId, true)

  return <CategoriesManagementClient initialCategories={categories} restaurantId={restaurantId} />
}
