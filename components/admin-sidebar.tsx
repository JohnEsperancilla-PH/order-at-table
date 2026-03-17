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
  Utensils,
  Table as TableIcon,
  Tags,
  Wallet,
  Home,
  Store,
  Shield,
  Building2,
  Users,
} from 'lucide-react'

interface AdminSidebarProps {
  restaurantSlug?: string
}

export function AdminSidebar({ restaurantSlug }: AdminSidebarProps) {
  const pathname = usePathname()

  const isActivePath = (url: string) => {
    if (url === '/admin' || url === '/admin/dashboard') {
      return pathname === '/admin' || pathname === '/admin/dashboard'
    }
    return pathname === url || pathname.startsWith(`${url}/`)
  }

  const getMenuItems = (slug?: string) => {
    if (slug) {
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
      ]
    } else {
      // Platform admin navigation
      return [
        {
          title: 'Dashboard',
          url: '/admin/dashboard',
          icon: LayoutDashboard,
        },
        {
          title: 'Restaurants',
          url: '/admin/restaurants',
          icon: Building2,
        },
        {
          title: 'Accounts',
          url: '/admin/restaurants/accounts',
          icon: Users,
        },
      ]
    }
  }

  const menuItems = getMenuItems(restaurantSlug)

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border/50 px-3 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground">
            {restaurantSlug ? <Store className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {restaurantSlug ? 'Cashier Console' : 'Platform Admin'}
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
            {restaurantSlug ? 'Navigation' : 'Main Navigation'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
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
        <p className="px-2 text-xs text-sidebar-foreground/70">
          Manage restaurants, accounts, and operations.
        </p>
      </SidebarFooter>
    </Sidebar>
  )
}

