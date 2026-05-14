import { redirect } from 'next/navigation'

export default async function ManagerRootPage({
  params,
}: {
  params: Promise<{ restaurantSlug: string }>
}) {
  const { restaurantSlug } = await params
  redirect(`/${restaurantSlug}/manager/dashboard`)
}
