import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAllRestaurants } from '@/lib/actions/restaurants'
import { getAllStaffAccountsForPlatformAdmin } from '@/lib/actions/staff'
import { getSession } from '@/lib/actions/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import {
  Building2,
  CircleCheck,
  Clock3,
  Users,
  ArrowRight,
  Store,
  UserPlus,
  ExternalLink,
  Crown,
  Shield,
} from 'lucide-react'

export default async function AdminDashboard() {
  const session = await getSession()

  if (!session) {
    redirect('/admin/login')
  }

  const [restaurants, accounts] = await Promise.all([
    getAllRestaurants(),
    getAllStaffAccountsForPlatformAdmin(),
  ])

  const openRestaurants = restaurants.filter((r) => r.is_open).length
  const closedRestaurants = restaurants.length - openRestaurants
  const activeAccounts = accounts.filter((a) => a.is_active).length
  const kitchenCount = restaurants.filter(
    (r) => r.subscription_features?.kitchen === true
  ).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Monitor restaurant activity, create staff accounts, and launch new restaurants from one place."
      >
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href="/admin/restaurants">
              <Store className="mr-1.5 h-4 w-4" />
              Restaurants
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/restaurants/accounts">
              <UserPlus className="mr-1.5 h-4 w-4" />
              Accounts
            </Link>
          </Button>
        </div>
      </PageHeader>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand/10">
            <Building2 className="h-4 w-4 text-brand" />
          </div>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Restaurants</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">{restaurants.length}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CircleCheck className="h-3 w-3 text-success" /> {openRestaurants} open
              </span>
              <span className="flex items-center gap-1">
                <Clock3 className="h-3 w-3 text-warning" /> {closedRestaurants} closed
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
            <CircleCheck className="h-4 w-4 text-success" />
          </div>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Currently Open</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-success">{openRestaurants}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              {closedRestaurants === 0
                ? 'All restaurants accepting orders'
                : `${closedRestaurants} restaurant${closedRestaurants !== 1 ? 's' : ''} closed`}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-warning/10">
            <Users className="h-4 w-4 text-warning" />
          </div>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Staff Accounts</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">{accounts.length}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              {activeAccounts} active · {accounts.length - activeAccounts} inactive
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand/10">
            <Crown className="h-4 w-4 text-brand" />
          </div>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Kitchen Enabled</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">{kitchenCount}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              {kitchenCount === 0
                ? 'No restaurants using Kitchen Display'
                : `${kitchenCount} with Kitchen Display access`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Restaurant list */}
      {restaurants.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h2 className="font-semibold">All Restaurants</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/restaurants">
                  Manage all <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="divide-y">
              {restaurants.slice(0, 10).map((restaurant) => {
                const staffCount = accounts.filter(
                  (a) =>
                    a.restaurants &&
                    (Array.isArray(a.restaurants)
                      ? a.restaurants[0]?.id
                      : a.restaurants?.id) === restaurant.id
                ).length
                return (
                  <div
                    key={restaurant.id}
                    className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{restaurant.name}</h3>
                        <Badge variant={restaurant.is_open ? 'default' : 'secondary'} className="shrink-0">
                          {restaurant.is_open ? 'Open' : 'Closed'}
                        </Badge>
                        {restaurant.subscription_features?.kitchen === true && (
                          <Badge variant="outline" className="shrink-0 gap-1 border-warning/40 text-warning">
                            <Crown className="h-3 w-3" />
                            Kitchen
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-mono">{restaurant.slug}</span>
                        {staffCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {staffCount} staff
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button asChild variant="outline" size="sm" className="h-8">
                        <Link href={`/${restaurant.slug}/cashier`}>
                          Cashier <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm" className="h-8">
                        <a
                          href={`/${restaurant.slug}/table/1`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
