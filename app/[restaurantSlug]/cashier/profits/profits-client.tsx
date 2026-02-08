'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { isSameDay } from 'date-fns'
import { TrendingUp, Receipt, CheckCircle2, Package } from 'lucide-react'

interface ProfitsClientProps {
  initialOrders: any[]
}

export function ProfitsClient({ initialOrders }: ProfitsClientProps) {
  const { todayTotal, todayCount, todayConfirmed, todayCompleted } = useMemo(() => {
    const todayOrders = initialOrders.filter(order =>
      isSameDay(new Date(order.created_at), new Date())
    )

    const todayTotalAmount = todayOrders
      .filter(order => order.status !== 'cancelled')
      .reduce((sum, order) => sum + order.total_amount, 0)

    const confirmed = todayOrders.filter(order => order.status === 'confirmed').length
    const completed = todayOrders.filter(order => order.status === 'completed').length

    return {
      todayTotal: todayTotalAmount,
      todayCount: todayOrders.length,
      todayConfirmed: confirmed,
      todayCompleted: completed,
    }
  }, [initialOrders])

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
      </div>
    </div>
  )
}
