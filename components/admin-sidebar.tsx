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
            url: `/${slug}/manager/dashboard`,
            icon: Home,
          },
          {
            title: 'Orders',
            url: `/${slug}/manager/orders`,
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

  // Pick exactly ONE active URL across all menu items using longest-prefix
  // matching. This prevents a parent route (e.g. /admin/restaurants) from
  // staying highlighted when on a child route (e.g. /admin/restaurants/accounts).
  const allItemUrls = [
    ...primaryItems.map((i) => i.url),
    ...secondaryItems.map((i) => i.url),
  ]

  // Treat /admin as alias of /admin/dashboard for matching purposes.
  const normalizedPath = pathname === '/admin/dashboard' ? '/admin' : pathname

  const activeUrl = allItemUrls.reduce<string | null>((best, url) => {
    const matches = normalizedPath === url || normalizedPath.startsWith(`${url}/`)
    if (!matches) return best
    if (!best || url.length > best.length) return url
    return best
  }, null)

  const isActiveUrl = (url: string) => activeUrl === url

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

  const primaryGroupLabel = isKitchenView
    ? 'Kitchen'
    : isManagerView
      ? 'Manage'
      : restaurantSlug
        ? 'Operate'
        : 'Platform'

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border/60 px-3 py-3.5">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
              restaurantSlug
                ? 'bg-brand/12 text-brand'
                : 'bg-foreground/[0.06] text-foreground'
            }`}
          >
            {restaurantSlug ? <Store className="h-[18px] w-[18px]" /> : <Shield className="h-[18px] w-[18px]" />}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[13px] font-semibold tracking-tight">{consoleLabel}</p>
            <p className="truncate text-[11px] text-sidebar-foreground/65">
              {restaurantSlug ? restaurantSlug : 'Operations Center'}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/55">
            {primaryGroupLabel}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {primaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActiveUrl(item.url)}
                    className="h-9 rounded-md px-2.5 text-[13px] font-medium data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-[inset_2px_0_0_0_var(--brand)]"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-[16px] w-[16px] shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {secondaryItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/55">
              {restaurantSlug ? 'Switch' : 'External'}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {secondaryItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActiveUrl(item.url)}
                      className="h-9 rounded-md px-2.5 text-[13px] font-normal text-sidebar-foreground/80 hover:text-sidebar-foreground"
                    >
                      <Link href={item.url}>
                        <item.icon className="h-[16px] w-[16px] shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60 p-3">
        <p className="text-[11px] leading-relaxed text-sidebar-foreground/60">
          {footerText}
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}
