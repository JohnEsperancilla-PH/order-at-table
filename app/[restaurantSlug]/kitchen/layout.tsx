import { AdminLayout } from '@/components/admin-layout'
import { getRestaurantBySlug } from '@/lib/actions/restaurants'

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ restaurantSlug: string }>
}) {
  const { restaurantSlug } = await params
  const restaurant = await getRestaurantBySlug(restaurantSlug)
  const kitchenEnabled = restaurant?.subscription_features?.kitchen === true

  return (
    <AdminLayout restaurantSlug={restaurantSlug} kitchenEnabled={kitchenEnabled}>
      {children}
    </AdminLayout>
  )
}
