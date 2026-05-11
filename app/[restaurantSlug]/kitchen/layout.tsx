import { AdminLayout } from '@/components/admin-layout'

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ restaurantSlug: string }>
}) {
  const { restaurantSlug } = await params
  return <AdminLayout restaurantSlug={restaurantSlug}>{children}</AdminLayout>
}
