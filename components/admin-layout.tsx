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
  kitchenEnabled?: boolean
}

export function AdminLayout({ children, restaurantSlug, kitchenEnabled = false }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const isCashierView = !!restaurantSlug
  const isManagerView = !!restaurantSlug && pathname.startsWith(`/${restaurantSlug}/manager`)

  const getStaffRole = () => {
    if (!restaurantSlug) return null
    if (typeof document === 'undefined') return null
    const match = document.cookie.match(new RegExp(`staff_role_${restaurantSlug}=([^;]+)`))
    return match ? match[1] : null
  }
  const staffRole = getStaffRole()

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
    ? (pathname === `/${restaurantSlug}/cashier/login` || pathname === `/${restaurantSlug}/manager/login`)
    : pathname === '/admin/login'

  if (isLoginPage) {
    return <>{children}</>
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    const redirectTo = restaurantSlug
      ? isManagerView ? `/${restaurantSlug}/manager/login` : `/${restaurantSlug}/cashier/login`
      : '/admin/login'
    router.replace(redirectTo)
  }

  const homeLink = restaurantSlug
    ? isManagerView ? `/${restaurantSlug}/manager` : `/${restaurantSlug}/cashier`
    : '/admin'
  const heading = restaurantSlug
    ? isManagerView ? `${restaurantSlug} Manager` : `${restaurantSlug} Cashier`
    : 'Platform Admin'

  return (
    <SidebarProvider>
      <AdminSidebar restaurantSlug={restaurantSlug} kitchenEnabled={kitchenEnabled} staffRole={staffRole} />
      <SidebarInset>
        <header className="app-header sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 px-4 md:h-16 md:px-6">
          <SidebarTrigger className="-ml-1 h-8 w-8" />
          <Separator orientation="vertical" className="mr-1 h-5" />
          <Link
            href={homeLink}
            className="truncate text-sm font-semibold tracking-tight md:text-[15px]"
          >
            {heading}
          </Link>
          <div className="hidden md:flex">
            <Badge
              variant="outline"
              className="gap-1.5 rounded-full border-border bg-secondary/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {restaurantSlug ? <Store className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
              {restaurantSlug ? (isManagerView ? 'Manager view' : 'Restaurant view') : 'Platform view'}
            </Badge>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            {isCashierView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className="h-8 gap-1.5 px-2.5 text-muted-foreground hover:text-foreground"
                title={isDarkMode ? 'Switch to light' : 'Switch to dark'}
              >
                {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{isDarkMode ? 'Light' : 'Dark'}</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="h-8 px-3 text-[13px] font-medium"
            >
              Sign out
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
