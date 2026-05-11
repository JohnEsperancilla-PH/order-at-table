'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  LayoutDashboard,
  LayoutGrid,
  Utensils,
  Table as TableIcon,
  Tags,
  Wallet,
  Home,
  Store,
  Shield,
  UserPlus,
  Compass,
  SlidersHorizontal,
} from 'lucide-react'

interface AdminSidebarProps {
  restaurantSlug?: string
}

export function AdminSidebar({ restaurantSlug }: AdminSidebarProps) {
  const pathname = usePathname()

  const isActivePath = (url: string) => {
    if (url === '/admin') {
      return pathname === '/admin' || pathname === '/admin/dashboard'
    }

    return pathname === url || pathname.startsWith(`${url}/`)
  }

  const getPrimaryMenuItems = (slug?: string) => {
    if (slug) {
      const isKitchenView = pathname.startsWith(`/${slug}/kitchen`)

      if (isKitchenView) {
        // Kitchen-only navigation
        return [
          {
            title: 'Kitchen Display',
            url: `/${slug}/kitchen`,
            icon: LayoutGrid,
          },
        ]
      }

      // Restaurant cashier navigation
      return [
        {
          title: 'Dashboard',
          url: `/${slug}/cashier/dashboard`,
          icon: Home,
        },
        {
          title: 'Orders',
          url: `/${slug}/cashier`,
          icon: LayoutDashboard,
        },
        {
          title: 'Kitchen',
          url: `/${slug}/kitchen`,
          icon: LayoutGrid,
        },
        {
          title: 'Tables',
          url: `/${slug}/cashier/tables`,
          icon: TableIcon,
        },
        {
          title: 'Menu',
          url: `/${slug}/cashier/menu`,
          icon: Utensils,
        },
        {
          title: 'Categories',
          url: `/${slug}/cashier/categories`,
          icon: Tags,
        },
        {
          title: 'Profits',
          url: `/${slug}/cashier/profits`,
          icon: Wallet,
        },
        {
          title: 'Settings',
          url: `/${slug}/cashier/settings`,
          icon: SlidersHorizontal,
        },
      ]
    } else {
      // Platform admin navigation
      return [
        {
          title: 'Overview',
          url: '/admin',
          icon: LayoutDashboard,
        },
        {
          title: 'Restaurants',
          url: '/admin/restaurants',
          icon: Store,
        },
        {
          title: 'Staff Accounts',
          url: '/admin/restaurants/accounts',
          icon: UserPlus,
        },
      ]
    }
  }

  const primaryItems = getPrimaryMenuItems(restaurantSlug)
  const isKitchenView = !!restaurantSlug && pathname.startsWith(`/${restaurantSlug}/kitchen`)

  const secondaryItems = restaurantSlug
    ? isKitchenView 
      ? [] // No secondary items in kitchen to stay focused
      : [
        {
          title: 'Back To Platform',
          url: '/admin',
          icon: Shield,
        },
      ]
    : [
        {
          title: 'Public Contact Page',
          url: '/contact',
          icon: Compass,
        },
      ]

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border/50 px-3 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground">
            {restaurantSlug ? <Store className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {isKitchenView ? 'Kitchen Console' : restaurantSlug ? 'Cashier Console' : 'Platform Admin'}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/70">
              {restaurantSlug ? restaurantSlug : 'Operations Center'}
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {isKitchenView ? 'Kitchen Navigation' : restaurantSlug ? 'Cashier Navigation' : 'Platform Navigation'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActivePath(item.url)}
                  >
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{restaurantSlug ? 'Platform' : 'External'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActivePath(item.url)}
                  >
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/50 p-2">
        <p className="px-2 text-xs leading-relaxed text-sidebar-foreground/70">
          {restaurantSlug
            ? 'Run daily cashier operations, menus, and profits from one place.'
            : 'Manage restaurants, staff accounts, and platform operations.'}
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}

