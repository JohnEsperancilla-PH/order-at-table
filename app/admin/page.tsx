import { getAllOrders } from '@/lib/actions/orders'
import { AdminDashboardClient } from './admin-client'

export default async function AdminPage() {
  const orders = await getAllOrders()

  return <AdminDashboardClient initialOrders={orders} />
}

