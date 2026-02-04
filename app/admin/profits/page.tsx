import { getAllOrders } from '@/lib/actions/orders'
import { ProfitsClient } from './profits-client'

export default async function ProfitsPage() {
  const orders = await getAllOrders()

  return <ProfitsClient initialOrders={orders} />
}
