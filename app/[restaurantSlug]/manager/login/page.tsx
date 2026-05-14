import { AdminLoginClient } from '@/app/[restaurantSlug]/cashier/login/login-client'

export default async function ManagerLoginPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>
}) {
  const { restaurantSlug } = await params
  return <AdminLoginClient restaurantSlug={restaurantSlug} redirectTo={`/${restaurantSlug}/manager`} />
}
