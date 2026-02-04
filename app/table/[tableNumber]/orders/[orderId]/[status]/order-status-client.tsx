'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Order } from '@/lib/types'
import { getOrderById } from '@/lib/actions/orders'
import { OrderConfirmationView } from '../../../order/order-client'

interface OrderStatusClientProps {
  initialOrder: Order
  tableNumber: string
  orderId: string
}

export function OrderStatusClient({
  initialOrder,
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
              `/table/${tableNumber}/orders/${updatedOrder.id}/${updatedOrder.status}`
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
      onClose={() => {
        router.replace(`/table/${tableNumber}`)
      }}
    />
  )
}
