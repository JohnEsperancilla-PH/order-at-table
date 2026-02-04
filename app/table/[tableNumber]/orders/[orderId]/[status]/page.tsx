import { notFound } from 'next/navigation'
import { getOrderById, getTableByNumber } from '@/lib/actions/orders'
import { OrderStatusClient } from './order-status-client'

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ tableNumber: string; orderId: string; status: string }>
}) {
  const { tableNumber, orderId } = await params

  try {
    await getTableByNumber(tableNumber)
    const order = await getOrderById(orderId, tableNumber)

    return (
      <OrderStatusClient
        initialOrder={order}
        tableNumber={tableNumber}
        orderId={orderId}
      />
    )
  } catch (error) {
    console.error('Error loading order status page:', error)
    notFound()
  }
}
