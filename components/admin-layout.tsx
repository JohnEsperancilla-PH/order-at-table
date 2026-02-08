'use client'

import { usePathname, useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AdminSidebar } from './admin-sidebar'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface AdminLayoutProps {
  children: React.ReactNode
  restaurantSlug?: string
}

export function AdminLayout({ children, restaurantSlug }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // Handle login page bypass
  const isLoginPage = restaurantSlug 
    ? pathname === `/${restaurantSlug}/cashier/login`
    : pathname === '/admin/login'

  if (isLoginPage) {
    return <>{children}</>
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    const redirectTo = restaurantSlug
      ? `/${restaurantSlug}/cashier/login`
      : '/admin/login'
    router.replace(redirectTo)
  }

  const homeLink = restaurantSlug ? `/${restaurantSlug}/cashier` : '/admin'

  return (
    <SidebarProvider>
      <AdminSidebar restaurantSlug={restaurantSlug} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Link href={homeLink} className="text-lg font-semibold">
            Order at Table
          </Link>
          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="mx-auto w-full max-w-6xl">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

