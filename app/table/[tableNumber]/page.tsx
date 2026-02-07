import Link from 'next/link'
import { getTableByNumber } from '@/lib/actions/orders'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Clock, Phone, UtensilsCrossed } from 'lucide-react'

export default async function TableWelcomePage({
  params,
}: {
  params: Promise<{ tableNumber: string }>
}) {
  const { tableNumber } = await params

  const table = await getTableByNumber(tableNumber)
  const restaurant = table.restaurants
  const isOpen = restaurant.is_open ?? true

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-background to-muted/20 flex flex-col">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div
          className="aspect-[16/9] w-full bg-gradient-to-br from-primary/20 to-primary/5"
          style={restaurant.cover_image_url ? {
            backgroundImage: `url(${restaurant.cover_image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : undefined}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md">
            {restaurant.name}
          </h1>
          {restaurant.description && (
            <p className="text-white/70 text-sm mt-1 line-clamp-2">
              {restaurant.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 pb-6 -mt-4 relative z-10">
        <div className="max-w-md mx-auto space-y-4">
          {/* Table info card */}
          <Card className="!gap-0">
            <CardContent className="pt-5 pb-5 text-center space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">You are seated at</p>
                <p className="text-3xl font-bold mt-1">Table {table.table_number}</p>
              </div>

              {isOpen ? (
                <>
                  <Badge variant="default" className="bg-green-600 hover:bg-green-600 text-white">
                    <span className="relative flex h-2 w-2 mr-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                    </span>
                    Open Now
                  </Badge>

                  <Button asChild size="lg" className="w-full rounded-xl h-12 text-base">
                    <Link href={`/table/${table.table_number}/order`}>
                      <UtensilsCrossed className="w-5 h-5 mr-2" />
                      Start Your Order
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="space-y-3">
                  <Badge variant="secondary" className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900">
                    Closed
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Sorry, we&apos;re currently closed. Please come back during our opening hours.
                  </p>
                </div>
              )}

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
    </div>
  )
}
