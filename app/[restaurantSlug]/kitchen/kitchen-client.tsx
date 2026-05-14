'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getOrdersByStatusAndRestaurantSlug, updateOrderStatus } from '@/lib/actions/orders'
import { KitchenTicket } from './kitchen-ticket'
import { Button } from '@/components/ui/button'
import { RefreshCw, Inbox, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { PageHeader } from '@/components/ui/page-header'
import { EmptyState } from '@/components/ui/empty-state'
import { LiveIndicator } from '@/components/ui/live-indicator'

interface KitchenDashboardClientProps {
  initialOrders: any[]
  restaurantSlug: string
}

export function KitchenDashboardClient({ initialOrders, restaurantSlug }: KitchenDashboardClientProps) {
  const [orders, setOrders] = useState(initialOrders)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  
  const ordersRef = useRef(orders)
  ordersRef.current = orders

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true)
    try {
      const freshOrders = await getOrdersByStatusAndRestaurantSlug('confirmed', restaurantSlug)
      
      // Optimization: Only update state if data actually changed
      const currentHash = JSON.stringify(ordersRef.current)
      const freshHash = JSON.stringify(freshOrders)
      
      if (currentHash !== freshHash) {
        setOrders(freshOrders)
        setLastUpdated(new Date())
      } else if (!silent) {
        // Even if no data change, update the timestamp if it was a manual refresh
        setLastUpdated(new Date())
      }
      
      setError(null)
    } catch (err) {
      console.error('Failed to load kitchen orders:', err)
      if (!silent) setError('Failed to refresh orders. Will retry automatically.')
    } finally {
      if (!silent) setIsRefreshing(false)
    }
  }, [restaurantSlug])

  // Polling for new orders
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders(true)
    }, 10000) // Poll every 10 seconds

    return () => clearInterval(interval)
  }, [loadOrders])

  const handleCompleteOrder = useCallback(async (orderId: string) => {
    try {
      await updateOrderStatus(restaurantSlug, orderId, 'ready_for_pickup' as any)
      // Optimistically remove from view
      setOrders(prev => prev.filter(o => o.id !== orderId))
    } catch (err) {
      console.error('Failed to update order status:', err)
      setError('Failed to mark order as ready. Please try again.')
      // Reload to ensure state is correct
      loadOrders(true)
    }
  }, [restaurantSlug, loadOrders])

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kitchen"
        title="Kitchen Display"
        description="Manage active tickets and special instructions."
      >
        <div className="hidden text-right sm:block">
          <p className="text-[11px] text-muted-foreground">Last updated</p>
          <p className="num text-[13px] font-medium">{lastUpdated.toLocaleTimeString()}</p>
        </div>

        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => loadOrders()}
          disabled={isRefreshing}
          aria-label="Refresh orders"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>

        <span className="inline-flex h-8 items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-success">
          <LiveIndicator color="success" />
          Live
        </span>
      </PageHeader>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)} className="h-auto p-1">
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30">
          <EmptyState
            icon={Inbox}
            title="Kitchen is clear"
            description="Waiting for new confirmed orders. Tickets will appear automatically as they come in."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {orders.map((order) => (
            <KitchenTicket
              key={order.id}
              order={order}
              onComplete={handleCompleteOrder}
            />
          ))}
        </div>
      )}
    </div>
  )
}
