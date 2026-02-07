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

const menuItems = [
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

export function AdminSidebar() {
  const pathname = usePathname()

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

