'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Order } from '@/lib/types'
import { getOrderById } from '@/lib/actions/orders'
import { OrderConfirmationView } from '../../../order/order-client'

interface OrderStatusClientProps {
  initialOrder: Order
  restaurantSlug: string
  tableNumber: string
  orderId: string
}

export function OrderStatusClient({
  initialOrder,
  restaurantSlug,
  tableNumber,
  orderId,
}: OrderStatusClientProps) {
  const router = useRouter()
  const [order, setOrder] = useState<Order>(initialOrder)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshNow = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const updatedOrder = await getOrderById(orderId, tableNumber)
      if (!updatedOrder) return
      setOrder(prev => {
        const statusChanged = prev.status !== updatedOrder.status
        if (statusChanged) {
          queueMicrotask(() =>
            router.replace(
              `/${restaurantSlug}/table/${tableNumber}/orders/${updatedOrder.id}/${updatedOrder.status}`,
            ),
          )
        }
        return updatedOrder
      })
    } catch (error) {
      console.error('Failed to refresh order status:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [orderId, restaurantSlug, router, tableNumber])

  useEffect(() => {
    const interval = setInterval(() => void refreshNow(), 5000)
    return () => clearInterval(interval)
  }, [refreshNow])

  return (
    <OrderConfirmationView
      order={order}
      isRefreshing={isRefreshing}
      restaurantName={(order as any)?.tables?.restaurants?.name}
      restaurantSlug={restaurantSlug}
      tableNumber={(order as any)?.tables?.table_number}
      coverImageUrl={(order as any)?.tables?.restaurants?.cover_image_url}
      onManualRefresh={refreshNow}
      onClose={() => {
        router.replace(`/${restaurantSlug}/table/${tableNumber}`)
      }}
    />
  )
}
