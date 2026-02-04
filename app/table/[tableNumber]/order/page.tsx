import { getTableByNumber } from '@/lib/actions/orders'
import { getMenuCategories, getMenuItems, getActiveOrder } from '@/lib/actions/orders'
import { OrderPageClient } from './order-client'
import { notFound } from 'next/navigation'

export default async function OrderPage({
  params,
}: {
  params: Promise<{ tableNumber: string }>
}) {
  const { tableNumber } = await params

  try {
    const table = await getTableByNumber(tableNumber)
    const [categories, menuItems, activeOrder] = await Promise.all([
      getMenuCategories(table.restaurant_id),
      getMenuItems(table.restaurant_id),
      getActiveOrder(table.id),
    ])

    return (
      <OrderPageClient
        table={table}
        categories={categories}
        menuItems={menuItems}
        activeOrder={activeOrder}
      />
    )
  } catch (error) {
    console.error('Error loading order page:', error)
    notFound()
  }
}

