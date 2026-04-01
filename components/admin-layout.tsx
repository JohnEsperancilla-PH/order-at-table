'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AdminSidebar } from './admin-sidebar'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Moon, ShieldCheck, Store, Sun } from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
  restaurantSlug?: string
}

export function AdminLayout({ children, restaurantSlug }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const isCashierView = !!restaurantSlug

  useEffect(() => {
    if (!isCashierView) return

    const saved = localStorage.getItem('cashier-theme')
    const shouldUseDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', shouldUseDark)
    setIsDarkMode(shouldUseDark)

    const handleThemeUpdate = () => {
      const latest = localStorage.getItem('cashier-theme')
      const isDark = latest === 'dark'
      document.documentElement.classList.toggle('dark', isDark)
      setIsDarkMode(isDark)
    }

    window.addEventListener('cashier-theme-update', handleThemeUpdate)
    return () => window.removeEventListener('cashier-theme-update', handleThemeUpdate)
  }, [isCashierView])

  const toggleDarkMode = () => {
    const next = !isDarkMode
    setIsDarkMode(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('cashier-theme', next ? 'dark' : 'light')
    window.dispatchEvent(new Event('cashier-theme-update'))
  }

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
  const heading = restaurantSlug ? `${restaurantSlug} Cashier` : 'Platform Admin'

  return (
    <SidebarProvider>
      <AdminSidebar restaurantSlug={restaurantSlug} />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Link href={homeLink} className="text-sm font-semibold md:text-base">
            {heading}
          </Link>
          <div className="hidden md:flex">
            <Badge variant="outline" className="gap-1.5 font-normal">
              {restaurantSlug ? <Store className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              {restaurantSlug ? 'Restaurant View' : 'Platform View'}
            </Badge>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {isCashierView && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleDarkMode}
                className="gap-1.5"
              >
                {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                {isDarkMode ? 'Light' : 'Dark'}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

