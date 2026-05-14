'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getOrdersByStatusAndRestaurantSlug, updateOrderStatus } from '@/lib/actions/orders'
import { KitchenTicket } from './kitchen-ticket'
import { Button } from '@/components/ui/button'
import { RefreshCw, Inbox, LayoutGrid, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <LayoutGrid className="w-8 h-8 text-primary" />
            Kitchen Display
          </h1>
          <p className="text-muted-foreground">
            Manage active tickets and special instructions
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-muted-foreground">Last updated</p>
            <p className="text-sm font-medium tabular-nums">
              {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadOrders()}
            disabled={isRefreshing}
            className={isRefreshing ? 'animate-spin' : ''}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Badge variant="outline" className="h-9 px-4 gap-2 border-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success/90" />
            </span>
            LIVE
          </Badge>
        </div>
      </div>

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
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
          <div className="bg-muted p-6 rounded-full mb-4">
            <Inbox className="w-12 h-12 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-semibold">Kitchen is Clear</h3>
          <p className="text-muted-foreground">Waiting for new confirmed orders...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
