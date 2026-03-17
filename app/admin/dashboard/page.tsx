import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAllRestaurants } from '@/lib/actions/restaurants'
import { getAllStaffAccountsForPlatformAdmin } from '@/lib/actions/staff'
import { getSession } from '@/lib/actions/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  CircleCheck,
  Clock3,
  Users,
  ArrowRight,
  Store,
  UserPlus,
  LayoutDashboard,
} from 'lucide-react'

export default async function AdminDashboardPage() {
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

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="rounded-2xl border bg-gradient-to-br from-background to-muted/40 p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <Badge variant="secondary" className="gap-1.5">
              <LayoutDashboard className="h-3.5 w-3.5" />
              Platform Overview
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Admin Dashboard</h1>
            <p className="max-w-2xl text-muted-foreground">
              Monitor restaurant activity, create staff accounts, and launch new restaurants from one place.
            </p>
          </div>
        </div>
      </section>

      {/* Stats cards */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Building2 className="h-4 w-4" />
              Total Restaurants
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="text-3xl font-bold tracking-tight">{restaurants.length}</div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/restaurants" className="gap-1.5">
                View <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CircleCheck className="h-4 w-4 text-emerald-500" />
              Currently Open
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {openRestaurants}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock3 className="h-4 w-4 text-amber-500" />
              Currently Closed
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="text-3xl font-bold tracking-tight">{closedRestaurants}</div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden transition-all hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4" />
              Staff Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="text-3xl font-bold tracking-tight">{activeAccounts}</div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/restaurants/accounts" className="gap-1.5">
                Manage <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link href="/admin/restaurants">
              <Store className="h-4 w-4" />
              Manage Restaurants
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="/admin/restaurants/accounts">
              <UserPlus className="h-4 w-4" />
              Create Staff Account
            </Link>
          </Button>
        </div>
      </section>

      {/* Recent restaurants preview */}
      {restaurants.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent restaurants</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/restaurants">View all</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {restaurants.slice(0, 6).map((restaurant) => (
              <Card key={restaurant.id} className="transition-all hover:border-primary/30">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{restaurant.name}</CardTitle>
                    <Badge variant={restaurant.is_open ? 'default' : 'secondary'} className="shrink-0">
                      {restaurant.is_open ? 'Open' : 'Closed'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{restaurant.slug}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Link href={`/${restaurant.slug}/cashier`}>
                      Open Cashier <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
