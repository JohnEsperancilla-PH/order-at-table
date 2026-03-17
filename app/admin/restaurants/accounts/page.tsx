import { redirect } from 'next/navigation'
import { getAllRestaurants } from '@/lib/actions/restaurants'
import { getAllStaffAccountsForPlatformAdmin } from '@/lib/actions/staff'
import { getSession } from '@/lib/actions/auth'
import { AccountsClient } from './accounts-client'

interface PageProps {
  searchParams: Promise<{ restaurant?: string }>
}

export default async function AdminAccountsPage({ searchParams }: PageProps) {
  const session = await getSession()

  if (!session) {
    redirect('/admin/login')
  }

  const params = await searchParams
  const preselectedRestaurantId = params.restaurant ?? null

  const [restaurants, accounts] = await Promise.all([
    getAllRestaurants(),
    getAllStaffAccountsForPlatformAdmin(),
  ])

  return (
    <AccountsClient
      initialRestaurants={restaurants}
      initialAccounts={accounts}
      preselectedRestaurantId={preselectedRestaurantId}
    />
  )
}
