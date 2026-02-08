'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
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
} from 'lucide-react'

interface AdminSidebarProps {
  restaurantSlug?: string
}

export function AdminSidebar({ restaurantSlug }: AdminSidebarProps) {
  const pathname = usePathname()

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
          icon: Home,
        },
        {
          title: 'Orders',
          url: '/admin',
          icon: LayoutDashboard,
        },
        {
          title: 'Tables',
          url: '/admin/tables',
          icon: TableIcon,
        },
        {
          title: 'Menu',
          url: '/admin/menu',
          icon: Utensils,
        },
        {
          title: 'Categories',
          url: '/admin/categories',
          icon: Tags,
        },
        {
          title: 'Profits',
          url: '/admin/profits',
          icon: Wallet,
        },
      ]
    }
  }

  const menuItems = getMenuItems(restaurantSlug)

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
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
    </Sidebar>
  )
}

