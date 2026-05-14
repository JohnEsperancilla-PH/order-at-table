'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/ui/page-header'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { updateRestaurant } from '@/lib/actions/restaurants'
import {
  Store,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Utensils,
  TableProperties,
  Package,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format, formatDistanceToNow } from 'date-fns'

interface DashboardClientProps {
  restaurant: {
    id: string
    name: string
    slug: string
    is_open?: boolean
  }
  counts: {
    totalOrders: number
    pendingOrders: number
    confirmedToday: number
    completedToday: number
    cancelledToday: number
    menuItems: number
    tables: number
  }
  recentOrders: Array<{
    id: string
    confirmation_code: string
    status: string
    total_amount: number
    created_at: string
    tables?: { table_number?: string }
  }>
}

export function DashboardClient({ restaurant, counts, recentOrders }: DashboardClientProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(restaurant.is_open ?? true)
  const [toggling, setToggling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleToggleOpen = async (checked: boolean) => {
    setIsOpen(checked)
    setToggling(true)
    setError(null)
    try {
      await updateRestaurant(restaurant.id, { is_open: checked })
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to update status')
      setIsOpen(!checked)
    } finally {
      setToggling(false)
    }
  }

  type StatCard = {
    label: string
    value: number
    valueClass?: string
    icon: typeof ClipboardList
    tone: 'neutral' | 'warning' | 'success' | 'destructive'
  }

  const stats: StatCard[] = [
    {
      label: 'All orders',
      value: counts.totalOrders,
      icon: ClipboardList,
      tone: 'neutral',
    },
    {
      label: 'Pending',
      value: counts.pendingOrders,
      valueClass: 'text-warning',
      icon: Clock,
      tone: 'warning',
    },
    {
      label: 'Completed today',
      value: counts.completedToday,
      icon: CheckCircle2,
      tone: 'success',
    },
    {
      label: 'Cancelled',
      value: counts.cancelledToday,
      icon: XCircle,
      tone: 'destructive',
    },
  ]

  const toneClass: Record<string, string> = {
    neutral: 'bg-foreground/[0.06] text-foreground',
    warning: 'bg-warning/10 text-warning',
    success: 'bg-success/10 text-success',
    destructive: 'bg-destructive/10 text-destructive',
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Restaurant"
        title="Dashboard"
        description="Quick overview of today's operations."
      >
        <div className="inline-flex items-center gap-3 rounded-full border border-border bg-background px-3 py-1.5">
          <Switch
            id="restaurant-open"
            checked={isOpen}
            onCheckedChange={handleToggleOpen}
            disabled={toggling}
          />
          <Label htmlFor="restaurant-open" className="cursor-pointer">
            {toggling ? (
              <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Updating…
              </span>
            ) : isOpen ? (
              <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-success">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                </span>
                Open
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
                Closed
              </span>
            )}
          </Label>
        </div>
      </PageHeader>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Restaurant identity row */}
      <Card className="overflow-hidden py-0">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-brand/10 text-brand">
              <Store className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold tracking-tight">{restaurant.name}</p>
              <p className="font-mono text-[12px] text-muted-foreground">/{restaurant.slug}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/${restaurant.slug}/cashier/settings`}>
                Settings
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={`/${restaurant.slug}/cashier`}>
                Orders
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Today metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="stat-card py-0">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[12px] font-medium text-muted-foreground">{stat.label}</p>
                <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${toneClass[stat.tone]}`}>
                  <stat.icon className="h-3.5 w-3.5" strokeWidth={2} />
                </div>
              </div>
              <p className={`num mt-2 text-[24px] font-semibold leading-none tracking-tight ${stat.valueClass ?? ''}`}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Menu & Tables */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="stat-card py-0">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="flex items-center gap-2 text-[12px] font-medium text-muted-foreground">
                <Utensils className="h-3.5 w-3.5" />
                Menu items
              </p>
              <p className="num mt-1.5 text-[24px] font-semibold leading-none tracking-tight">
                {counts.menuItems}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${restaurant.slug}/cashier/menu`}>
                Manage
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="stat-card py-0">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="flex items-center gap-2 text-[12px] font-medium text-muted-foreground">
                <TableProperties className="h-3.5 w-3.5" />
                Tables
              </p>
              <p className="num mt-1.5 text-[24px] font-semibold leading-none tracking-tight">
                {counts.tables}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${restaurant.slug}/cashier/tables`}>
                Manage
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <Card className="overflow-hidden py-0">
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-3.5">
          <div>
            <p className="section-eyebrow">Recent activity</p>
            <h2 className="mt-0.5 text-[15px] font-semibold tracking-tight">Recent orders</h2>
          </div>
          {recentOrders.length > 5 && (
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${restaurant.slug}/cashier`}>
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>
        {recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-5 py-10 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted/60 ring-1 ring-inset ring-border/60">
              <Package className="h-5 w-5 text-muted-foreground/70" />
            </div>
            <div>
              <p className="text-[14px] font-semibold tracking-tight">No orders today</p>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">Orders will appear here as they come in.</p>
            </div>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/${restaurant.slug}/cashier`}>Go to orders</Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            {recentOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="data-row flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="num font-mono text-[13px] font-semibold tracking-[0.08em]">
                    {order.confirmation_code}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-[12px] text-muted-foreground">
                    <span>Table {order.tables?.table_number || 'N/A'}</span>
                    <span aria-hidden>·</span>
                    <span>{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="num text-[13.5px] font-semibold">
                    {formatCurrency(order.total_amount)}
                  </p>
                  <Badge variant="secondary" className="mt-0.5 px-1.5 py-0 text-[10px] font-normal capitalize">
                    {order.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
