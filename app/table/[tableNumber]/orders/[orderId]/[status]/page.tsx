import { notFound } from 'next/navigation'
import { getOrderById, getTableByNumber } from '@/lib/actions/orders'
import { OrderStatusClient } from './order-status-client'

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ tableNumber: string; orderId: string; status: string }>
}) {
  let order
  let tableNumber
  let orderId

  try {
    const resolvedParams = await params
    tableNumber = resolvedParams.tableNumber
    orderId = resolvedParams.orderId

    if (!tableNumber || !orderId) {
      return notFound()
    }

    // Verify table exists
    await getTableByNumber(tableNumber)

    // Fetch order with full relationships
    order = await getOrderById(orderId, tableNumber)

    if (!order) {
      return notFound()
    }

    return (
      <OrderStatusClient
        initialOrder={order}
        tableNumber={tableNumber}
        orderId={orderId}
      />
    )
  } catch (error) {
    console.error('Error loading order status page:', {
      error: error instanceof Error ? error.message : String(error),
      tableNumber,
      orderId,
    })
    return notFound()
  }
}
