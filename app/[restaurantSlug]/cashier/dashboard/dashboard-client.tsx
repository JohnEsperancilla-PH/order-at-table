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

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Quick overview of today's operations.">
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <Switch
            id="restaurant-open"
            checked={isOpen}
            onCheckedChange={handleToggleOpen}
            disabled={toggling}
          />
          <Label htmlFor="restaurant-open" className="cursor-pointer font-medium flex items-center gap-1.5">
            {toggling ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isOpen ? (
              <Badge variant="outline" className="border-success/30 bg-success-muted text-success-muted-foreground gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
                Open
              </Badge>
            ) : (
              <Badge variant="outline" className="border-destructive/20 text-destructive gap-1">
                <span className="relative flex h-2 w-2 rounded-full bg-destructive" />
                Closed
              </Badge>
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

      {/* Restaurant identity card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{restaurant.name}</CardTitle>
              <p className="text-sm text-muted-foreground font-mono">{restaurant.slug}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href={`/${restaurant.slug}/cashier/settings`}>
                Restaurant settings <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/${restaurant.slug}/cashier`}>
                Orders console <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <ClipboardList className="h-3.5 w-3.5" />
              All orders
            </div>
            <p className="text-2xl font-bold tabular-nums">{counts.totalOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Clock className="h-3.5 w-3.5" />
              Pending
            </div>
            <p className="text-2xl font-bold tabular-nums text-warning">{counts.pendingOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              Completed today
            </div>
            <p className="text-2xl font-bold tabular-nums">{counts.completedToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <XCircle className="h-3.5 w-3.5 text-destructive" />
              Cancelled
            </div>
            <p className="text-2xl font-bold tabular-nums">{counts.cancelledToday}</p>
          </CardContent>
        </Card>
      </div>

      {/* Menu & Tables quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Menu items</p>
              <p className="text-2xl font-bold tabular-nums">{counts.menuItems}</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${restaurant.slug}/cashier/menu`}>
                Manage <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Tables</p>
              <p className="text-2xl font-bold tabular-nums">{counts.tables}</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${restaurant.slug}/cashier/tables`}>
                Manage <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
              <Package className="h-8 w-8 opacity-30" />
              <p className="text-sm">No orders today</p>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/${restaurant.slug}/cashier`}>Go to orders</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold tracking-wider">
                      {order.confirmation_code}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>Table {order.tables?.table_number || 'N/A'}</span>
                      <span>&middot;</span>
                      <span>{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold tabular-nums">
                      {formatCurrency(order.total_amount)}
                    </p>
                    <Badge variant="secondary" className="text-[10px] mt-0.5">
                      {order.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
          {recentOrders.length > 5 && (
            <div className="px-4 py-3 border-t">
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link href={`/${restaurant.slug}/cashier`}>
                  View all orders <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
