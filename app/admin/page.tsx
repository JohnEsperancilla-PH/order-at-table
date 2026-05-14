import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAllRestaurants } from '@/lib/actions/restaurants'
import { getAllStaffAccountsForPlatformAdmin } from '@/lib/actions/staff'
import { getSession } from '@/lib/actions/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { AdminOverviewClient } from './admin-overview-client'
import {
  Building2,
  CircleCheck,
  Clock3,
  Users,
  ArrowRight,
  Store,
  UserPlus,
  Crown,
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

  type StatCard = {
    label: string
    value: number
    valueClass?: string
    icon: typeof Building2
    tone: 'brand' | 'success' | 'warning'
    footer: ReactNode
    href?: string
  }

  const stats: StatCard[] = [
    {
      label: 'Total restaurants',
      value: restaurants.length,
      icon: Building2,
      tone: 'brand',
      href: '/admin/restaurants',
      footer: (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CircleCheck className="h-3 w-3 text-success" />
            {openRestaurants} open
          </span>
          <span className="flex items-center gap-1">
            <Clock3 className="h-3 w-3 text-warning" />
            {closedRestaurants} closed
          </span>
        </div>
      ),
    },
    {
      label: 'Currently open',
      value: openRestaurants,
      valueClass: 'text-success',
      icon: CircleCheck,
      tone: 'success',
      footer: (
        <p className="text-xs text-muted-foreground">
          {closedRestaurants === 0
            ? 'All restaurants accepting orders'
            : `${closedRestaurants} restaurant${closedRestaurants !== 1 ? 's' : ''} closed`}
        </p>
      ),
    },
    {
      label: 'Staff accounts',
      value: accounts.length,
      icon: Users,
      tone: 'warning',
      href: '/admin/restaurants/accounts',
      footer: (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{activeAccounts}</span> active
          {' · '}
          <span>{accounts.length - activeAccounts}</span> inactive
        </p>
      ),
    },
    {
      label: 'Kitchen enabled',
      value: kitchenCount,
      icon: Crown,
      tone: 'brand',
      footer: (
        <p className="text-xs text-muted-foreground">
          {kitchenCount === 0
            ? 'No restaurants using Kitchen Display'
            : `${kitchenCount} with Kitchen Display access`}
        </p>
      ),
    },
  ]

  const toneClass: Record<string, string> = {
    brand: 'bg-brand/10 text-brand',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Platform"
        title="Admin Overview"
        description="Monitor restaurant activity, create staff accounts, and launch new restaurants — all from one place."
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/restaurants/accounts">
            <UserPlus className="h-4 w-4" />
            Accounts
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/admin/restaurants">
            <Store className="h-4 w-4" />
            Restaurants
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const cardInner = (
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p
                    className={`num mt-2 text-[28px] font-semibold leading-none tracking-tight ${
                      stat.valueClass ?? ''
                    }`}
                  >
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] ${toneClass[stat.tone]}`}
                >
                  <stat.icon className="h-4 w-4" strokeWidth={2} />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/70 pt-3">
                {stat.footer}
                {stat.href && (
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                )}
              </div>
            </CardContent>
          )

          return stat.href ? (
            <Link key={stat.label} href={stat.href} className="group block">
              <Card className="stat-card overflow-hidden py-0">{cardInner}</Card>
            </Link>
          ) : (
            <Card key={stat.label} className="stat-card overflow-hidden py-0">
              {cardInner}
            </Card>
          )
        })}
      </div>

      <AdminOverviewClient restaurants={restaurants} accounts={accounts} />
    </div>
  )
}
