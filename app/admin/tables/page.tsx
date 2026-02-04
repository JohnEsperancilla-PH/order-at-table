import { getAllTables } from '@/lib/actions/tables'
import { TablesManagementClient } from './tables-client'

export default async function TablesPage() {
  // For now, using the first restaurant. In production, you'd get this from auth/session
  const restaurantId = '00000000-0000-0000-0000-000000000001'
  
  const tables = await getAllTables(restaurantId)

  return <TablesManagementClient initialTables={tables} restaurantId={restaurantId} />
}

