'use client'

import { useState, useEffect, type ChangeEvent } from 'react'
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
import { Separator } from '@/components/ui/separator'
import { formatCurrency } from '@/lib/utils'
import {
  createMenuItem,
  toggleMenuItemAvailability,
  updateMenuItem,
  deleteMenuItem,
} from '@/lib/actions/menu'
import { addSize, deleteSize, getSizesForMenuItem } from '@/lib/actions/sizes'
import { getMenuCategoriesByRestaurantSlug, getMenuItemsByRestaurantSlug } from '@/lib/actions/orders'
import { MenuCategory } from '@/lib/types'
import { CheckCircle2, XCircle, RefreshCw, Plus, Edit, Trash2, UtensilsCrossed, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface MenuManagementClientProps {
  categories: MenuCategory[]
  menuItems: any[]
  restaurantSlug: string
  restaurantId: string
}

export function MenuManagementClient({
  categories,
  menuItems: initialMenuItems,
  restaurantSlug,
  restaurantId,
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)
  const [deleteItemName, setDeleteItemName] = useState<string | null>(null)
  const [sizes, setSizes] = useState<any[]>([])
  const [sizeName, setSizeName] = useState('')
  const [sizePriceModifier, setSizePriceModifier] = useState('')
  const [isNewItem, setIsNewItem] = useState(false)
  const [isSavingItem, setIsSavingItem] = useState(false)
  const supabase = createClient()

  const loadMenuData = async () => {
    try {
      setIsRefreshing(true)
      const [items, categoriesData] = await Promise.all([
        getMenuItemsByRestaurantSlug(restaurantSlug, true),
        getMenuCategoriesByRestaurantSlug(restaurantSlug, true),
      ])
      
      // Load sizes for each item
      const itemsWithSizes = await Promise.all(
        items.map(async (item: any) => {
          try {
            const itemSizes = await getSizesForMenuItem(item.id)
            return { ...item, sizes: itemSizes }
          } catch (error) {
            return { ...item, sizes: [] }
          }
        })
      )
      
      setMenuItems(itemsWithSizes)
      setCategoryList(categoriesData)
    } catch (error) {
      console.error('Failed to refresh menu items:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadMenuData()
    }, 10000)

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
      await loadMenuData()
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
    setSizes([])
    setSizeName('')
    setSizePriceModifier('')
    setIsNewItem(false)
    setIsItemDialogOpen(true)
  }

  const handleOpenEditItem = async (item: any) => {
    setEditingItemId(item.id)
    setItemName(item.name || '')
    setItemDescription(item.description || '')
    setItemPrice(item.price?.toString() || '')
    setItemCategoryId(item.category_id || '')
    setItemAvailable(item.is_available ?? true)
    setItemError(null)
    setItemImageFile(null)
    setItemImagePreview(item.image_url || null)
    setSizeName('')
    setSizePriceModifier('')
    setIsNewItem(false)
    try {
      const itemSizes = await getSizesForMenuItem(item.id)
      setSizes(itemSizes)
    } catch (error) {
      console.error('Failed to load sizes:', error)
      setSizes([])
    }
    setIsItemDialogOpen(true)
  }

  const handleOpenDeleteItem = (item: any) => {
    setDeleteItemId(item.id)
    setDeleteItemName(item.name || '')
    setItemError(null)
    setIsDeleteDialogOpen(true)
  }

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
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

    setIsSavingItem(true)
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
        await loadMenuData()
        setIsItemDialogOpen(false)
      } else {
        const newItem = await createMenuItem(restaurantId, {
          name: itemName.trim(),
          description: itemDescription.trim() || null,
          price: priceValue,
          category_id: itemCategoryId,
          is_available: itemAvailable,
          image_url: imageUrl,
        })
        // Stay in the dialog to allow adding sizes
        setEditingItemId(newItem.id)
        setIsNewItem(true)
        setSizes([])
        setSizeName('')
        setSizePriceModifier('')
        setItemError(null)
      }
    } catch (error: any) {
      setItemError(error.message || 'Failed to save menu item')
    } finally {
      setIsUploadingImage(false)
      setIsSavingItem(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!deleteItemId) return

    try {
      await deleteMenuItem(deleteItemId)
      await loadMenuData()
    } catch (error: any) {
      setItemError(error.message || 'Failed to delete menu item')
    } finally {
      setIsDeleteDialogOpen(false)
      setDeleteItemId(null)
      setDeleteItemName(null)
    }
  }

  const handleAddSize = async () => {
    if (!editingItemId) return
    if (!sizeName.trim()) {
      setItemError('Size name is required')
      return
    }
    const modifier = Number.parseFloat(sizePriceModifier || '0')
    if (Number.isNaN(modifier)) {
      setItemError('Price modifier must be a valid number')
      return
    }

    try {
      const newSize = await addSize(editingItemId, {
        name: sizeName.trim(),
        price_modifier: modifier,
      })
      setSizes([...sizes, newSize])
      setSizeName('')
      setSizePriceModifier('')
      setItemError(null)
    } catch (error: any) {
      setItemError(error.message || 'Failed to add size')
    }
  }

  const handleDeleteSize = async (sizeId: string) => {
    try {
      await deleteSize(sizeId)
      setSizes(sizes.filter(s => s.id !== sizeId))
      setItemError(null)
    } catch (error: any) {
      setItemError(error.message || 'Failed to delete size')
    }
  }

  const handlecloseItemDialog = (open: boolean) => {
    if (!open) {
      setIsNewItem(false)
    }
    setIsItemDialogOpen(open)
  }

  const calculatePriceRange = (item: any, itemSizes?: any[]) => {
    // Try to get sizes from the item object if not provided
    const sizesForItem = itemSizes || (item.sizes || [])
    
    if (sizesForItem.length === 0) {
      // No sizes, just return base price
      return formatCurrency(item.price)
    }
    
    // Calculate min and max with price modifiers
    const basePriceWithModifiers = [
      item.price,
      ...sizesForItem.map((s: any) => item.price + s.price_modifier)
    ]
    
    const minPrice = Math.min(...basePriceWithModifiers)
    const maxPrice = Math.max(...basePriceWithModifiers)
    
    if (minPrice === maxPrice) {
      return formatCurrency(minPrice)
    }
    
    return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`
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
          {itemError && !isItemDialogOpen && !isDeleteDialogOpen && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{itemError}</AlertDescription>
            </Alert>
          )}
          {menuItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <UtensilsCrossed className="w-12 h-12 text-muted-foreground/30" />
              <p className="text-sm">No menu items yet</p>
              <Button size="sm" variant="outline" onClick={handleOpenAddItem}>
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Add your first item
              </Button>
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
                        <div className="space-y-2">
                          {items.map((item: any) => (
                            <div
                              key={item.id}
                              className={`flex flex-col gap-3 rounded-lg border p-3 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                                item.is_available ? 'hover:bg-muted/30' : 'opacity-60 bg-muted/20'
                              }`}
                            >
                              <div className="flex gap-3 flex-1 min-w-0">
                                {item.image_url ? (
                                  <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className="h-14 w-14 rounded-lg object-cover shrink-0"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                    <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0 space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold truncate">{item.name}</h3>
                                    <Badge
                                      variant={item.is_available ? 'default' : 'secondary'}
                                      className="flex items-center gap-1 shrink-0 text-[10px] px-1.5 h-5"
                                    >
                                      {item.is_available ? (
                                        <><CheckCircle2 className="h-2.5 w-2.5" />On</>
                                      ) : (
                                        <><XCircle className="h-2.5 w-2.5" />Off</>
                                      )}
                                    </Badge>
                                  </div>
                                  {item.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                      {item.description}
                                    </p>
                                  )}
                                  <p className="text-sm font-bold tabular-nums">{calculatePriceRange(item, item.sizes)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 sm:justify-end">
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
                                  variant="ghost"
                                  className="h-8 w-8"
                                  aria-label={`Edit ${item.name}`}
                                  onClick={() => handleOpenEditItem(item)}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  aria-label={`Delete ${item.name}`}
                                  onClick={() => handleOpenDeleteItem(item)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
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
                    <div className="space-y-3">
                      {uncategorizedItems.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold">{item.name}</h3>
                              <Badge
                                variant={item.is_available ? 'default' : 'secondary'}
                                className="flex items-center gap-1"
                              >
                                {item.is_available ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3" />
                                    Available
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3" />
                                    Unavailable
                                  </>
                                )}
                              </Badge>
                            </div>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">
                                {item.description}
                              </p>
                            )}
                            <p className="text-lg font-bold">{calculatePriceRange(item, item.sizes)}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            <Label htmlFor={`switch-${item.id}`} className="sr-only">
                              Toggle availability
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
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              aria-label={`Delete ${item.name}`}
                              onClick={() => handleOpenDeleteItem(item)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <Dialog open={isItemDialogOpen} onOpenChange={handlecloseItemDialog}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItemId ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
            <DialogDescription>
              {editingItemId ? 'Update menu item details.' : 'Create a new menu item.'}
            </DialogDescription>
          </DialogHeader>

          {itemError && (
            <Alert variant="destructive">
              <AlertDescription>{itemError}</AlertDescription>
            </Alert>
          )}

          {isNewItem && (
            <Alert>
              <AlertDescription>Item created! Add sizes on the right if needed, then click Done.</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Left column — Item details */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Item Details</p>
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
                  className="mt-1 min-h-[72px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                  <div className="mt-2 overflow-hidden rounded-lg border">
                    <img
                      src={itemImagePreview}
                      alt="Preview"
                      className="h-32 w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Switch
                  id="item-available"
                  checked={itemAvailable}
                  onCheckedChange={setItemAvailable}
                />
                <Label htmlFor="item-available">Available</Label>
              </div>
            </div>

            {/* Right column — Sizes */}
            <div className="space-y-4 sm:border-l sm:pl-6">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Sizes</p>
              <p className="text-xs text-muted-foreground -mt-2">Add sizes with price modifiers (optional)</p>

              {sizes.length > 0 ? (
                <div className="space-y-2">
                  {sizes.map(size => (
                    <div key={size.id} className="flex items-center justify-between p-2.5 border rounded-lg bg-muted/40">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{size.name}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          +{formatCurrency(size.price_modifier)}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                        onClick={() => handleDeleteSize(size.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                  No sizes added yet. Items will use the base price.
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">Add Size</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="size-name" className="text-xs">Name</Label>
                    <Input
                      id="size-name"
                      value={sizeName}
                      onChange={(e) => setSizeName(e.target.value)}
                      placeholder="e.g., Large"
                      className="mt-1 h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="size-modifier" className="text-xs">Modifier (PHP)</Label>
                    <Input
                      id="size-modifier"
                      type="number"
                      value={sizePriceModifier}
                      onChange={(e) => setSizePriceModifier(e.target.value)}
                      placeholder="0.00"
                      className="mt-1 h-9 text-sm"
                      step="0.01"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddSize}
                  className="w-full"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add Size
                </Button>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsItemDialogOpen(false)
                if (isNewItem) {
                  loadMenuData()
                }
              }}
              className="flex-1"
              disabled={isUploadingImage || isSavingItem}
            >
              {isNewItem ? 'Done' : 'Cancel'}
            </Button>
            {!isNewItem && (
              <Button onClick={handleCreateOrUpdateItem} className="flex-1" disabled={isUploadingImage || isSavingItem}>
                {isUploadingImage
                  ? 'Uploading...'
                  : isSavingItem
                    ? editingItemId ? 'Saving...' : 'Creating...'
                    : editingItemId
                      ? 'Save Changes'
                      : 'Create Item'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Menu Item</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Delete {deleteItemName || 'this item'}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteItem}
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

