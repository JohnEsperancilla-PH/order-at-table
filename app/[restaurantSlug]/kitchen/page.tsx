import { getRestaurantBySlug } from '@/lib/actions/restaurants'
import { getOrdersByStatusAndRestaurantSlug } from '@/lib/actions/orders'
import { notFound } from 'next/navigation'
import { KitchenDashboardClient } from './kitchen-client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Crown, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function KitchenPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>
}) {
  const { restaurantSlug } = await params

  const restaurant = await getRestaurantBySlug(restaurantSlug)
  if (!restaurant) {
    notFound()
  }

  const kitchenEnabled = restaurant.subscription_features?.kitchen === true

  if (!kitchenEnabled) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-warning-muted p-4">
          <Crown className="h-10 w-10 text-warning" />
        </div>
        <div className="max-w-md space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Kitchen Display</h1>
          <p className="text-muted-foreground">
            This feature requires a subscription upgrade. Contact the platform
            administrator to enable Kitchen Display for{' '}
            <span className="font-medium text-foreground">{restaurant.name}</span>.
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2 rounded-xl">
          <Link href={`/${restaurantSlug}/cashier`}>
            <ArrowLeft className="h-4 w-4" />
            Back to Cashier
          </Link>
        </Button>
      </div>
    )
  }

  const orders = await getOrdersByStatusAndRestaurantSlug('confirmed', restaurantSlug)

  return (
    <KitchenDashboardClient
      initialOrders={orders}
      restaurantSlug={restaurantSlug}
    />
  )
}
