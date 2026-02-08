'use client'

import { useEffect, useState } from 'react'
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

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        setIsRefreshing(true)
        const updatedOrder = await getOrderById(orderId, tableNumber)
        if (updatedOrder) {
          setOrder(updatedOrder)
          if (updatedOrder.status !== order.status) {
            router.replace(
              `/${restaurantSlug}/table/${tableNumber}/orders/${updatedOrder.id}/${updatedOrder.status}`
            )
          }
        }
      } catch (error) {
        console.error('Failed to refresh order status:', error)
      } finally {
        setIsRefreshing(false)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [orderId, order.status, router, tableNumber])

  return (
    <OrderConfirmationView
      order={order}
      isRefreshing={isRefreshing}
      restaurantName={(order as any)?.tables?.restaurants?.name}
      restaurantSlug={restaurantSlug}
      tableNumber={(order as any)?.tables?.table_number}
      coverImageUrl={(order as any)?.tables?.restaurants?.cover_image_url}
      onClose={() => {
        router.replace(`/${restaurantSlug}/table/${tableNumber}`)
      }}
    />
  )
}
