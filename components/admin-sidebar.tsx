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
  kitchenEnabled?: boolean
  staffRole?: string | null
}

export function AdminSidebar({ restaurantSlug, kitchenEnabled = false, staffRole }: AdminSidebarProps) {
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
      const isManagerView = pathname.startsWith(`/${slug}/manager`)

      if (isKitchenView) {
        return [
          {
            title: 'Kitchen Display',
            url: `/${slug}/kitchen`,
            icon: LayoutGrid,
          },
        ]
      }

      if (isManagerView) {
        // Manager: full access to all pages
        return [
          {
            title: 'Dashboard',
            url: `/${slug}/manager`,
            icon: Home,
          },
          {
            title: 'Orders',
            url: `/${slug}/manager`,
            icon: LayoutDashboard,
          },
          ...(kitchenEnabled
            ? [{ title: 'Kitchen', url: `/${slug}/kitchen`, icon: LayoutGrid }]
            : []),
          {
            title: 'Tables',
            url: `/${slug}/manager/tables`,
            icon: TableIcon,
          },
          {
            title: 'Menu',
            url: `/${slug}/manager/menu`,
            icon: Utensils,
          },
          {
            title: 'Categories',
            url: `/${slug}/manager/categories`,
            icon: Tags,
          },
          {
            title: 'Profits',
            url: `/${slug}/manager/profits`,
            icon: Wallet,
          },
          {
            title: 'Settings',
            url: `/${slug}/manager/settings`,
            icon: SlidersHorizontal,
          },
        ]
      }

      // Cashier: limited to Orders, Menu, Categories (no Kitchen)
      return [
        {
          title: 'Orders',
          url: `/${slug}/cashier`,
          icon: LayoutDashboard,
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
      ]
    }

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

  const primaryItems = getPrimaryMenuItems(restaurantSlug)
  const isKitchenView = !!restaurantSlug && pathname.startsWith(`/${restaurantSlug}/kitchen`)
  const isManagerView = !!restaurantSlug && pathname.startsWith(`/${restaurantSlug}/manager`)

  const secondaryItems = restaurantSlug
    ? isKitchenView
      ? []
      : [
          ...(isManagerView
            ? [
                {
                  title: 'Cashier View',
                  url: `/${restaurantSlug}/cashier`,
                  icon: Store,
                },
              ]
            : [
                {
                  title: 'Manager View',
                  url: `/${restaurantSlug}/manager`,
                  icon: Shield,
                },
              ]),
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

  const consoleLabel = isKitchenView
    ? 'Kitchen Console'
    : isManagerView
      ? 'Manager Console'
      : restaurantSlug
        ? 'Cashier Console'
        : 'Platform Admin'

  const footerText = isManagerView
    ? 'Full restaurant management: dashboards, menus, tables, profits, and settings.'
    : restaurantSlug
      ? 'Focused cashier tools for orders, menus, and categories.'
      : 'Manage restaurants, staff accounts, and platform operations.'

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border/50 px-3 py-4">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-md ${restaurantSlug ? 'bg-brand/15 text-brand' : 'bg-sidebar-accent text-sidebar-accent-foreground'}`}>
            {restaurantSlug ? <Store className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{consoleLabel}</p>
            <p className="truncate text-xs text-sidebar-foreground/70">
              {restaurantSlug ? restaurantSlug : 'Operations Center'}
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {isKitchenView
              ? 'Kitchen Navigation'
              : isManagerView
                ? 'Manager Navigation'
                : restaurantSlug
                  ? 'Cashier Navigation'
                  : 'Platform Navigation'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActivePath(item.url)}>
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

        {secondaryItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{restaurantSlug ? 'Switch View' : 'External'}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {secondaryItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActivePath(item.url)}>
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
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/50 p-2">
        <p className="px-2 text-xs leading-relaxed text-sidebar-foreground/70">
          {footerText}
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
