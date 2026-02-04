'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { isSameDay } from 'date-fns'

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

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Profit</CardTitle>
          <CardDescription>Total from orders placed today (excluding cancelled)</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-3xl font-bold">{formatCurrency(todayTotal)}</div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{todayCount} orders</Badge>
            <Badge variant="outline">{todayConfirmed} confirmed</Badge>
            <Badge variant="outline">{todayCompleted} completed</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
