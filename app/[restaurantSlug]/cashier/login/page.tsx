import { AdminLoginClient } from './login-client'

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>
}) {
  const { restaurantSlug } = await params
  return <AdminLoginClient restaurantSlug={restaurantSlug} />
}
