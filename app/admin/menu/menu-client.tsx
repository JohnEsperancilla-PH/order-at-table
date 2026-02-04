'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { formatCurrency } from '@/lib/utils'
import {
  createMenuItem,
  toggleMenuItemAvailability,
  updateMenuItem,
} from '@/lib/actions/menu'
import { getMenuCategories, getMenuItems } from '@/lib/actions/orders'
import { MenuCategory } from '@/lib/types'
import { CheckCircle2, XCircle, RefreshCw, Plus, Edit } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface MenuManagementClientProps {
  categories: MenuCategory[]
  menuItems: any[]
}

export function MenuManagementClient({
  categories,
  menuItems: initialMenuItems,
}: MenuManagementClientProps) {
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())
  const [menuItems, setMenuItems] = useState(initialMenuItems)
  const [categoryList, setCategoryList] = useState(categories)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [itemPrice, setItemPrice] = useState('')
  const [itemCategoryId, setItemCategoryId] = useState('')
  const [itemAvailable, setItemAvailable] = useState(true)
  const [itemError, setItemError] = useState<string | null>(null)
  const [itemImageFile, setItemImageFile] = useState<File | null>(null)
  const [itemImagePreview, setItemImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const supabase = createClient()
  
  // For now, using the first restaurant. In production, you'd get this from auth/session
  const restaurantId = '00000000-0000-0000-0000-000000000001'
  
  const loadMenuData = async () => {
    try {
      setIsRefreshing(true)
      const [items, categoriesData] = await Promise.all([
        getMenuItems(restaurantId, true),
        getMenuCategories(restaurantId, true),
      ])
      setMenuItems(items)
      setCategoryList(categoriesData)
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
      loadMenuData()
    }, 10000) // Refresh every 10 seconds (menu changes less frequently)

    return () => clearInterval(interval)
  }, [autoRefresh])

  const itemsByCategory = categoryList.reduce<Record<string, any[]>>((acc, category) => {
    acc[category.id] = []
    return acc
  }, {})

  menuItems.forEach(item => {
    const key = itemsByCategory[item.category_id] ? item.category_id : 'uncategorized'
    if (!itemsByCategory[key]) {
      itemsByCategory[key] = []
    }
    itemsByCategory[key].push(item)
  })

  const uncategorizedItems = itemsByCategory['uncategorized'] || []

  const handleToggleAvailability = async (itemId: string, currentStatus: boolean) => {
    setUpdatingItems(prev => new Set(prev).add(itemId))
    try {
      await toggleMenuItemAvailability(itemId, !currentStatus)
      await loadMenuData() // Refresh menu data after toggle
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

  const handleOpenAddItem = () => {
    setEditingItemId(null)
    setItemName('')
    setItemDescription('')
    setItemPrice('')
    setItemCategoryId(categoryList[0]?.id || '')
    setItemAvailable(true)
    setItemError(null)
    setItemImageFile(null)
    setItemImagePreview(null)
    setIsItemDialogOpen(true)
  }

  const handleOpenEditItem = (item: any) => {
    setEditingItemId(item.id)
    setItemName(item.name || '')
    setItemDescription(item.description || '')
    setItemPrice(item.price?.toString() || '')
    setItemCategoryId(item.category_id || '')
    setItemAvailable(item.is_available ?? true)
    setItemError(null)
    setItemImageFile(null)
    setItemImagePreview(item.image_url || null)
    setIsItemDialogOpen(true)
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setItemImageFile(file)
    setItemImagePreview(URL.createObjectURL(file))
  }

  const compressImage = async (file: File) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    const loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = objectUrl
    })

    const maxWidth = 1200
    const scale = Math.min(1, maxWidth / loaded.width)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(loaded.width * scale)
    canvas.height = Math.round(loaded.height * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      URL.revokeObjectURL(objectUrl)
      throw new Error('Failed to compress image')
    }
    ctx.drawImage(loaded, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', 0.75)
    )

    URL.revokeObjectURL(objectUrl)

    if (!blob) {
      throw new Error('Failed to compress image')
    }

    return new File([blob], `${file.name.split('.')[0]}.webp`, {
      type: 'image/webp',
    })
  }

  const handleCreateOrUpdateItem = async () => {
    if (!itemName.trim()) {
      setItemError('Item name is required')
      return
    }
    if (!itemCategoryId) {
      setItemError('Category is required')
      return
    }
    const priceValue = Number.parseFloat(itemPrice)
    if (Number.isNaN(priceValue) || priceValue <= 0) {
      setItemError('Price must be greater than zero')
      return
    }

    try {
      let imageUrl: string | null = null

      if (itemImageFile) {
        setIsUploadingImage(true)
        const compressed = await compressImage(itemImageFile)
        const safeName = itemName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
        const filePath = `${restaurantId}/${Date.now()}-${safeName}.webp`

        const { error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(filePath, compressed, {
            cacheControl: '3600',
            upsert: false,
            contentType: compressed.type,
          })

        if (uploadError) {
          throw new Error(uploadError.message)
        }

        const { data } = supabase.storage.from('menu-images').getPublicUrl(filePath)
        imageUrl = data.publicUrl
      }

      if (editingItemId) {
        await updateMenuItem(editingItemId, {
          name: itemName.trim(),
          description: itemDescription.trim() || null,
          price: priceValue,
          category_id: itemCategoryId,
          is_available: itemAvailable,
          image_url: imageUrl ?? itemImagePreview,
        })
      } else {
        await createMenuItem(restaurantId, {
          name: itemName.trim(),
          description: itemDescription.trim() || null,
          price: priceValue,
          category_id: itemCategoryId,
          is_available: itemAvailable,
          image_url: imageUrl,
        })
      }
      await loadMenuData()
      setIsItemDialogOpen(false)
    } catch (error: any) {
      setItemError(error.message || 'Failed to save menu item')
    } finally {
      setIsUploadingImage(false)
    }
  }


  return (
    <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground">
            Toggle menu item availability
          </p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <Button onClick={handleOpenAddItem}>
            <Plus className="w-4 h-4 mr-2" />
            Add Menu Item
          </Button>
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
            onClick={loadMenuData}
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
            {menuItems.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No menu items found.
              </div>
            ) : (
              <Accordion type="multiple" className="w-full">
                {categoryList.map(category => {
                  const items = itemsByCategory[category.id] || []
                  return (
                    <AccordionItem key={category.id} value={category.id}>
                      <AccordionTrigger className="text-base">
                        <div className="flex items-center gap-2">
                          <span>{category.name}{category.is_active ? '' : ' (inactive)'}</span>
                          <Badge variant="secondary">{items.length}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {items.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground">
                            No items in this category.
                          </div>
                        ) : (
                          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {items.map((item: any) => (
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
                                        {formatCurrency(item.price)}
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
                                        <Button
                                          size="icon"
                                          variant="outline"
                                          aria-label={`Edit ${item.name}`}
                                          onClick={() => handleOpenEditItem(item)}
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
                {uncategorizedItems.length > 0 && (
                  <AccordionItem value="uncategorized">
                    <AccordionTrigger className="text-base">
                      <div className="flex items-center gap-2">
                        <span>Uncategorized</span>
                        <Badge variant="secondary">{uncategorizedItems.length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {uncategorizedItems.map((item: any) => (
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
                                    {formatCurrency(item.price)}
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
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      aria-label={`Edit ${item.name}`}
                                      onClick={() => handleOpenEditItem(item)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            )}
          </CardContent>
        </Card>

      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItemId ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
            <DialogDescription>
              {editingItemId ? 'Update menu item details.' : 'Create a new menu item.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {itemError && (
              <Alert variant="destructive">
                <AlertDescription>{itemError}</AlertDescription>
              </Alert>
            )}
            <div>
              <Label htmlFor="item-name">Name</Label>
              <Input
                id="item-name"
                value={itemName}
                onChange={(event) => setItemName(event.target.value)}
                placeholder="e.g., Chicken Adobo"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="item-description">Description (optional)</Label>
              <Textarea
                id="item-description"
                value={itemDescription}
                onChange={(event) => setItemDescription(event.target.value)}
                placeholder="Short description"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="item-price">Price (PHP)</Label>
              <Input
                id="item-price"
                type="number"
                value={itemPrice}
                onChange={(event) => setItemPrice(event.target.value)}
                placeholder="0.00"
                className="mt-1"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label htmlFor="item-image">Image (auto-compressed)</Label>
              <Input
                id="item-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="mt-1"
              />
              {itemImagePreview && (
                <div className="mt-3 overflow-hidden rounded-md border">
                  <img
                    src={itemImagePreview}
                    alt="Preview"
                    className="h-40 w-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
            <div>
              <Label>Category</Label>
              <Select value={itemCategoryId} onValueChange={setItemCategoryId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryList.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="item-available"
                checked={itemAvailable}
                onCheckedChange={setItemAvailable}
              />
              <Label htmlFor="item-available">Available</Label>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsItemDialogOpen(false)}
                className="flex-1"
                disabled={isUploadingImage}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateOrUpdateItem} className="flex-1" disabled={isUploadingImage}>
                {isUploadingImage
                  ? 'Uploading...'
                  : editingItemId
                    ? 'Save Changes'
                    : 'Add Item'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}

