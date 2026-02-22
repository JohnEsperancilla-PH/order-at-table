import { getTableByRestaurantSlugAndNumber } from '@/lib/actions/orders'
import { getMenuCategories, getMenuItems } from '@/lib/actions/orders'
import { getSizesForMenuItems } from '@/lib/actions/sizes'
import { OrderPageClient } from './order-client'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Clock, Phone, ArrowLeft } from 'lucide-react'

export default async function OrderPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string; tableNumber: string }>
}) {
  const { restaurantSlug, tableNumber } = await params

  try {
    // Validate inputs early
    if (!restaurantSlug || !tableNumber) {
      notFound()
    }

    // Get table information first
    const table = await getTableByRestaurantSlugAndNumber(restaurantSlug, tableNumber)
    const restaurant = table.restaurants

    // Additional security check - ensure restaurant slug matches
    if (restaurant.slug !== restaurantSlug) {
      console.error('Restaurant slug mismatch:', { expected: restaurantSlug, actual: restaurant.slug })
      notFound()
    }

    // Show closed landing page if restaurant is closed
    if (restaurant?.is_open === false) {
      return (
        <div className="min-h-[100dvh] bg-gradient-to-b from-background to-muted/20 pb-6">
          {/* Force 9:16 vertical layout */}
          <div className="max-w-md mx-auto p-4 space-y-4">
            {/* Hero — mobile optimized */}
            <div className="relative overflow-hidden rounded-xl">
              <div
                className="aspect-[16/9] w-full bg-gradient-to-br from-primary/20 to-primary/5"
                style={restaurant.cover_image_url ? {
                  backgroundImage: `url(${restaurant.cover_image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                } : undefined}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-md">
                  {restaurant.name}
                </h1>
                {restaurant.description && (
                  <p className="text-white/70 text-sm mt-1 line-clamp-2">
                    {restaurant.description}
                  </p>
                )}
              </div>
            </div>

            <Card className="!gap-0">
              <CardContent className="pt-5 pb-5 text-center space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">You are seated at</p>
                  <p className="text-2xl font-bold mt-1">Table {table.table_number}</p>
                </div>

                <div className="space-y-3">
                  <Badge variant="secondary" className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900">
                    Closed
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Sorry, ordering is not available right now. Please come back during our opening hours.
                  </p>
                </div>

                <Button asChild variant="outline" size="lg" className="w-full rounded-xl h-12 text-base">
                  <Link href={`/${restaurantSlug}/table/${tableNumber}`}>
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Welcome
                  </Link>
                </Button>

                {/* Opening hours & contact */}
                {(restaurant.opening_hours || restaurant.contact_number) && (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-2 text-sm">
                      {restaurant.opening_hours && (
                        <div className="flex items-center gap-2 text-muted-foreground justify-center">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>{restaurant.opening_hours}</span>
                        </div>
                      )}
                      {restaurant.contact_number && (
                        <div className="flex items-center gap-2 text-muted-foreground justify-center">
                          <Phone className="w-4 h-4 shrink-0" />
                          <a href={`tel:${restaurant.contact_number}`} className="hover:underline">
                            {restaurant.contact_number}
                          </a>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    const [categories, menuItems] = await Promise.all([
      getMenuCategories(table.restaurant_id),
      getMenuItems(table.restaurant_id, true),
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
      <OrderPageClient
        table={table}
        categories={categories}
        menuItems={menuItemsWithSizes}
        restaurantSlug={restaurantSlug}
      />
    )
  } catch (error) {
    console.error('Error loading order page:', error)
    notFound()
  }
}

