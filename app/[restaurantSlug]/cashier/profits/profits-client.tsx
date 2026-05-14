'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { isSameDay } from 'date-fns'
import { TrendingUp, Receipt, CheckCircle2, Package } from 'lucide-react'

interface ProfitsClientProps {
  initialOrders: any[]
  menuItems: any[]
}

export function ProfitsClient({ initialOrders, menuItems }: ProfitsClientProps) {
  const {
    todayTotal,
    todayCount,
    todayConfirmed,
    todayCompleted,
    hourlyDemand,
    topItems,
    lowItems,
    estimatedMargin,
    estimatedMarginRate,
    cancelledReasonBreakdown,
    stockoutCount,
    estimatedStockoutImpact,
  } = useMemo(() => {
    const todayOrders = initialOrders.filter(order =>
      isSameDay(new Date(order.created_at), new Date())
    )

    const todayTotalAmount = todayOrders
      .filter(order => order.status !== 'cancelled')
      .reduce((sum, order) => sum + order.total_amount, 0)

    const confirmed = todayOrders.filter(order => order.status === 'confirmed').length
    const completed = todayOrders.filter(order => order.status === 'completed').length

    const hourlyBuckets = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0, revenue: 0 }))
    const itemMetrics: Record<string, { name: string; qty: number; revenue: number; margin: number }> = {}
    const cancellationReasons: Record<string, number> = {}

    for (const order of todayOrders) {
      const created = new Date(order.created_at)
      const hour = created.getHours()
      hourlyBuckets[hour].count += 1
      hourlyBuckets[hour].revenue += Number(order.total_amount || 0)

      if (order.status === 'cancelled') {
        const reason = (order.cancelled_reason || 'Not specified').trim()
        cancellationReasons[reason] = (cancellationReasons[reason] || 0) + 1
      }

      const orderItems = order.order_items || []
      for (const item of orderItems) {
        const key = item.menu_item_id || item.menu_items?.id
        const name = item.menu_items?.name || 'Unknown Item'
        const qty = Number(item.quantity || 0)
        const revenue = qty * Number(item.price || 0)
        const cost = qty * Number(item.menu_items?.cost_price || 0)

        if (!key) continue
        if (!itemMetrics[key]) {
          itemMetrics[key] = { name, qty: 0, revenue: 0, margin: 0 }
        }

        itemMetrics[key].qty += qty
        itemMetrics[key].revenue += revenue
        itemMetrics[key].margin += revenue - cost
      }
    }

    const rankedItems = Object.values(itemMetrics).sort((a, b) => b.qty - a.qty)
    const top = rankedItems.slice(0, 5)
    const low = [...rankedItems].reverse().slice(0, 5)

    const marginValue = Object.values(itemMetrics).reduce((sum, item) => sum + item.margin, 0)
    const marginRate = todayTotalAmount > 0 ? (marginValue / todayTotalAmount) * 100 : 0

    const unavailableMenuItems = (menuItems || []).filter((item: any) => !item.is_available)
    const stockoutImpact = unavailableMenuItems.reduce(
      (sum: number, item: any) => sum + Number(item.price || 0),
      0
    )

    return {
      todayTotal: todayTotalAmount,
      todayCount: todayOrders.length,
      todayConfirmed: confirmed,
      todayCompleted: completed,
      hourlyDemand: hourlyBuckets,
      topItems: top,
      lowItems: low,
      estimatedMargin: marginValue,
      estimatedMarginRate: marginRate,
      cancelledReasonBreakdown: Object.entries(cancellationReasons)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count),
      stockoutCount: unavailableMenuItems.length,
      estimatedStockoutImpact: stockoutImpact,
    }
  }, [initialOrders, menuItems])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profits</h1>
          <p className="text-muted-foreground">
            Daily earnings snapshot for today
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Revenue</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground/60" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{formatCurrency(todayTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">Excluding cancelled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
              <Receipt className="w-4 h-4 text-muted-foreground/60" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{todayCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Placed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed</CardTitle>
              <Package className="w-4 h-4 text-muted-foreground/60" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{todayConfirmed}</p>
            <p className="text-xs text-muted-foreground mt-1">Payment verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              <CheckCircle2 className="w-4 h-4 text-muted-foreground/60" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{todayCompleted}</p>
            <p className="text-xs text-muted-foreground mt-1">Fulfilled today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Estimated Margin</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground/60" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{formatCurrency(estimatedMargin)}</p>
            <p className="text-xs text-muted-foreground mt-1">{estimatedMarginRate.toFixed(1)}% margin rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hourly Demand Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-2 text-xs">
              {hourlyDemand.map(bucket => {
                const intensity = Math.min(1, bucket.count / 6)
                return (
                  <div
                    key={bucket.hour}
                    className="rounded-md border p-2"
                    style={{ backgroundColor: `oklch(0.52 0.15 150 / ${0.08 + intensity * 0.35})` }}
                  >
                    <p className="font-semibold">{bucket.hour.toString().padStart(2, '0')}:00</p>
                    <p>{bucket.count} orders</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cancellation Reasons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cancelledReasonBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cancellations today.</p>
            ) : (
              cancelledReasonBreakdown.map(entry => (
                <div key={entry.reason} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>{entry.reason}</span>
                  <span className="font-semibold tabular-nums">{entry.count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Top Menu Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No item data yet.</p>
            ) : (
              topItems.map(item => (
                <div key={item.name} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>{item.name}</span>
                  <span className="font-semibold tabular-nums">{item.qty}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Low-Performing Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No item data yet.</p>
            ) : (
              lowItems.map(item => (
                <div key={item.name} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>{item.name}</span>
                  <span className="font-semibold tabular-nums">{item.qty}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Stockout Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{stockoutCount}</p>
            <p className="text-sm text-muted-foreground mt-1">Unavailable menu items</p>
            <p className="text-lg font-semibold tabular-nums mt-3">{formatCurrency(estimatedStockoutImpact)}</p>
            <p className="text-xs text-muted-foreground mt-1">Estimated lost sales opportunity</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
