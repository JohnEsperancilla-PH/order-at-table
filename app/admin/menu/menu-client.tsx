'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toggleMenuItemAvailability } from '@/lib/actions/menu'
import { getMenuItems } from '@/lib/actions/orders'
import { MenuItem, MenuCategory } from '@/lib/types'
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MenuManagementClientProps {
  categories: MenuCategory[]
  menuItems: any[]
}

export function MenuManagementClient({
  categories,
  menuItems: initialMenuItems,
}: MenuManagementClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())
  const [menuItems, setMenuItems] = useState(initialMenuItems)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const router = useRouter()
  
  // For now, using the first restaurant. In production, you'd get this from auth/session
  const restaurantId = '00000000-0000-0000-0000-000000000001'
  
  const loadMenuItems = async () => {
    try {
      setIsRefreshing(true)
      const items = await getMenuItems(restaurantId)
      setMenuItems(items)
    } catch (error) {
      console.error('Failed to refresh menu items:', error)
    } finally {
      setIsRefreshing(false)
    }
  }
  
  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadMenuItems()
    }, 10000) // Refresh every 10 seconds (menu changes less frequently)

    return () => clearInterval(interval)
  }, [autoRefresh])

  const filteredItems = selectedCategory
    ? menuItems.filter(item => item.category_id === selectedCategory)
    : menuItems

  const handleToggleAvailability = async (itemId: string, currentStatus: boolean) => {
    setUpdatingItems(prev => new Set(prev).add(itemId))
    try {
      await toggleMenuItemAvailability(itemId, !currentStatus)
      await loadMenuItems() // Refresh menu items after toggle
    } catch (error: any) {
      alert(error.message || 'Failed to update item availability')
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground">
            Toggle menu item availability
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-refresh-menu"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh-menu" className="cursor-pointer">
              Auto-refresh
            </Label>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadMenuItems}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

        <Card>
          <CardHeader>
            <CardTitle>Menu Items</CardTitle>
            <CardDescription>
              Enable or disable items to control what customers can order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedCategory || 'all'} onValueChange={val => setSelectedCategory(val === 'all' ? null : val)}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                {categories.slice(0, 4).map(category => (
                  <TabsTrigger key={category.id} value={category.id}>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={selectedCategory || 'all'} className="mt-4">
                <div className="space-y-4">
                  {filteredItems.map((item: any) => (
                    <Card key={item.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">
                                {item.name}
                              </h3>
                              <Badge
                                variant={item.is_available ? 'default' : 'secondary'}
                                className="flex items-center gap-1"
                              >
                                {item.is_available ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" />
                                    Available
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3" />
                                    Unavailable
                                  </>
                                )}
                              </Badge>
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.description}
                              </p>
                            )}
                            <p className="text-lg font-bold mt-2">
                              ${item.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`switch-${item.id}`}>
                                {item.is_available ? 'Available' : 'Unavailable'}
                              </Label>
                              <Switch
                                id={`switch-${item.id}`}
                                checked={item.is_available}
                                onCheckedChange={() =>
                                  handleToggleAvailability(item.id, item.is_available)
                                }
                                disabled={updatingItems.has(item.id)}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
    </div>
  )
}

