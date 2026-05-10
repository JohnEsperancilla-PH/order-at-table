'use client'

import { useState, useEffect, type ChangeEvent } from 'react'
import { useSyncedInitial } from '@/hooks/use-synced-initial'
import { useRouter } from 'next/navigation'
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
  deleteMenuItem,
} from '@/lib/actions/menu'
import {
  addMenuItemModifiersBatch,
  deleteMenuItemModifier,
  getModifiersForMenuItem,
  getModifiersForRestaurant,
} from '@/lib/actions/modifiers'
import {
  listModifierPresets,
  createModifierPreset,
  updateModifierPreset,
  deleteModifierPreset,
  type ModifierPreset,
} from '@/lib/actions/modifier-presets'
import { getMenuCategoriesByRestaurantSlug, getMenuItemsByRestaurantSlug } from '@/lib/actions/orders'
import { MenuCategory } from '@/lib/types'
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  UtensilsCrossed,
  Image as ImageIcon,
  Save,
  SlidersHorizontal,
} from 'lucide-react'
import { uploadMenuItemImage } from '@/lib/actions/storage'

type ModifierDraftRow = { id: string; name: string; priceDelta: string }

function newDraftId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `d_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function createModifierDraftRow(): ModifierDraftRow {
  return {
    id: newDraftId(),
    name: '',
    priceDelta: '',
  }
}

function draftRowFromPreset(preset: ModifierPreset): ModifierDraftRow {
  const pm =
    typeof preset.price_modifier === 'number' && Number.isFinite(preset.price_modifier)
      ? preset.price_modifier
      : 0
  return {
    id: newDraftId(),
    name: String(preset.name ?? '').trim(),
    priceDelta: String(pm),
  }
}

type ModifierDraftParseResult =
  | { ok: true; modifiers: Array<{ name: string; price_modifier: number }> }
  | { ok: false; error: string }

function parseModifierDraftRows(rows: ModifierDraftRow[]): ModifierDraftParseResult {
  for (const r of rows) {
    if (!r.name.trim() && r.priceDelta.trim() !== '') {
      return { ok: false, error: 'Enter a label for every row that has a price.' }
    }
  }
  const modifiers: Array<{ name: string; price_modifier: number }> = []
  for (const r of rows) {
    const name = r.name.trim()
    if (!name) continue
    const raw = r.priceDelta.trim()
    const delta = Number.parseFloat(raw === '' ? '0' : raw)
    if (Number.isNaN(delta)) {
      return { ok: false, error: `Invalid price for “${name}”. Use a number (0 for no change).` }
    }
    modifiers.push({ name, price_modifier: delta })
  }
  return { ok: true, modifiers }
}

interface MenuManagementClientProps {
  categories: MenuCategory[]
  menuItems: any[]
  restaurantSlug: string
  restaurantId: string
  initialModifierPresets: ModifierPreset[]
}

export function MenuManagementClient({
  categories,
  menuItems: initialMenuItems,
  restaurantSlug,
  restaurantId,
  initialModifierPresets,
}: MenuManagementClientProps) {
  const router = useRouter()
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())
  const [menuItems, setMenuItems] = useState(initialMenuItems)
  const [modifierPresets, setModifierPresets] = useSyncedInitial(initialModifierPresets)
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
  const [toggleError, setToggleError] = useState<string | null>(null)
  const [modifiers, setModifiers] = useState<any[]>([])
  const [modifierDraftRows, setModifierDraftRows] = useState<ModifierDraftRow[]>([])
  const [isPresetImportDialogOpen, setIsPresetImportDialogOpen] = useState(false)
  const [presetImportSelection, setPresetImportSelection] = useState<string[]>([])
  const [isPresetDialogOpen, setIsPresetDialogOpen] = useState(false)
  const [editingPreset, setEditingPreset] = useState<ModifierPreset | null>(null)
  const [presetFormName, setPresetFormName] = useState('')
  const [presetFormPrice, setPresetFormPrice] = useState('')
  const [presetFormError, setPresetFormError] = useState<string | null>(null)
  const [presetSaving, setPresetSaving] = useState(false)
  const [isPresetDeleteDialogOpen, setIsPresetDeleteDialogOpen] = useState(false)
  const [deletePresetId, setDeletePresetId] = useState<string | null>(null)
  const [deletePresetName, setDeletePresetName] = useState<string | null>(null)
  const [presetDeleteError, setPresetDeleteError] = useState<string | null>(null)
  const [isSavingModifiers, setIsSavingModifiers] = useState(false)
  const [isNewItem, setIsNewItem] = useState(false)
  const [isSavingItem, setIsSavingItem] = useState(false)

  const loadMenuData = async () => {
    try {
      setIsRefreshing(true)
      const [items, categoriesData] = await Promise.all([
        getMenuItemsByRestaurantSlug(restaurantSlug, true),
        getMenuCategoriesByRestaurantSlug(restaurantSlug, true),
      ])
      
      const [modifiersMap, presets] = await Promise.all([
        getModifiersForRestaurant(restaurantId),
        listModifierPresets(restaurantId),
      ])
      const itemsWithModifiers = items.map((item: any) => ({
        ...item,
        modifiers: modifiersMap[item.id] || [],
      }))

      setMenuItems(itemsWithModifiers)
      setCategoryList(categoriesData)
      setModifierPresets(presets)
    } catch (error) {
      console.error('Failed to refresh menu items:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  /** Reload menu client state and refresh Server Components (layout/nav). */
  const refreshMenuAfterChange = async () => {
    await loadMenuData()
    router.refresh()
  }

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadMenuData()
    }, 10000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  useEffect(() => {
    setCategoryList(categories)
  }, [categories])

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
    setToggleError(null)
    setUpdatingItems(prev => new Set(prev).add(itemId))
    try {
      await toggleMenuItemAvailability(itemId, !currentStatus, restaurantSlug)
      await refreshMenuAfterChange()
    } catch (error: unknown) {
      setToggleError(error instanceof Error ? error.message : 'Failed to update item availability')
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
    setModifiers([])
    setModifierDraftRows([createModifierDraftRow()])
    setPresetImportSelection([])
    setIsPresetImportDialogOpen(false)
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
    setModifierDraftRows([createModifierDraftRow()])
    setPresetImportSelection([])
    setIsPresetImportDialogOpen(false)
    setIsNewItem(false)
    try {
      const itemModifiers = await getModifiersForMenuItem(item.id)
      setModifiers(itemModifiers)
    } catch (error) {
      console.error('Failed to load modifiers:', error)
      setModifiers([])
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

    let createModifiersParsed: Array<{ name: string; price_modifier: number }> | null = null
    if (!editingItemId) {
      const modifierParse = parseModifierDraftRows(modifierDraftRows)
      if (!modifierParse.ok) {
        setItemError(modifierParse.error)
        return
      }
      createModifiersParsed = modifierParse.modifiers
    }

    setIsSavingItem(true)
    try {
      let imageUrl: string | null = null

      if (itemImageFile) {
        setIsUploadingImage(true)
        const compressed = await compressImage(itemImageFile)
        const formData = new FormData()
        formData.append('file', compressed)
        imageUrl = await uploadMenuItemImage(restaurantId, formData)
      }

      if (editingItemId) {
        await updateMenuItem(
          editingItemId,
          {
            name: itemName.trim(),
            description: itemDescription.trim() || null,
            price: priceValue,
            category_id: itemCategoryId,
            is_available: itemAvailable,
            image_url: imageUrl ?? itemImagePreview,
          },
          restaurantSlug
        )
        await refreshMenuAfterChange()
        setIsItemDialogOpen(false)
      } else {
        const newItem = await createMenuItem(
          restaurantId,
          {
            name: itemName.trim(),
            description: itemDescription.trim() || null,
            price: priceValue,
            category_id: itemCategoryId,
            is_available: itemAvailable,
            image_url: imageUrl,
          },
          restaurantSlug
        )
        if (createModifiersParsed && createModifiersParsed.length > 0) {
          await addMenuItemModifiersBatch(newItem.id, createModifiersParsed, restaurantSlug)
        }
        setEditingItemId(newItem.id)
        setIsNewItem(true)
        setItemError(null)
        await refreshMenuAfterChange()
        const savedRows = await getModifiersForMenuItem(newItem.id)
        setModifiers(savedRows)
        setModifierDraftRows([createModifierDraftRow()])
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
      await deleteMenuItem(deleteItemId, restaurantSlug)
      await refreshMenuAfterChange()
    } catch (error: any) {
      setItemError(error.message || 'Failed to delete menu item')
    } finally {
      setIsDeleteDialogOpen(false)
      setDeleteItemId(null)
      setDeleteItemName(null)
    }
  }

  const openPresetImportDialog = () => {
    setPresetImportSelection([])
    setIsPresetImportDialogOpen(true)
  }

  const togglePresetImportSelection = (id: string) => {
    setPresetImportSelection(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const selectAllPresetImports = () => setPresetImportSelection(modifierPresets.map(p => p.id))
  const clearPresetImportSelection = () => setPresetImportSelection([])

  const handleConfirmPresetBatchImport = () => {
    if (presetImportSelection.length === 0) return
    const rows = presetImportSelection
      .map(id => modifierPresets.find(p => p.id === id))
      .filter((p): p is ModifierPreset => Boolean(p))
      .map(draftRowFromPreset)
    if (rows.length === 0) return
    setModifierDraftRows(prev => [...prev, ...rows])
    setPresetImportSelection([])
    setIsPresetImportDialogOpen(false)
    setItemError(null)
  }

  const handleOpenPresetDialog = (preset?: ModifierPreset) => {
    setEditingPreset(preset ?? null)
    setPresetFormName(preset?.name ?? '')
    setPresetFormPrice(
      preset != null && typeof preset.price_modifier === 'number'
        ? String(preset.price_modifier)
        : '0'
    )
    setPresetFormError(null)
    setIsPresetDialogOpen(true)
  }

  const handleSavePreset = async () => {
    if (!presetFormName.trim()) {
      setPresetFormError('Name is required')
      return
    }
    const pv = Number.parseFloat(presetFormPrice.trim() === '' ? '0' : presetFormPrice)
    if (Number.isNaN(pv)) {
      setPresetFormError('Price adjustment must be a number (use 0 for no change)')
      return
    }

    setPresetSaving(true)
    setPresetFormError(null)
    try {
      if (editingPreset) {
        const updated = await updateModifierPreset(
          editingPreset.id,
          { name: presetFormName.trim(), price_modifier: pv },
          restaurantSlug
        )
        setModifierPresets(prev => prev.map(p => (p.id === updated.id ? updated : p)))
      } else {
        const created = await createModifierPreset(
          restaurantId,
          { name: presetFormName.trim(), price_modifier: pv },
          restaurantSlug
        )
        setModifierPresets(prev => [...prev, created])
      }
      router.refresh()
      setIsPresetDialogOpen(false)
    } catch (error: unknown) {
      setPresetFormError(error instanceof Error ? error.message : 'Failed to save default modifier')
    } finally {
      setPresetSaving(false)
    }
  }

  const handleDeletePreset = async () => {
    if (!deletePresetId) return
    setPresetDeleteError(null)
    try {
      await deleteModifierPreset(deletePresetId, restaurantSlug)
      setModifierPresets(prev => prev.filter(p => p.id !== deletePresetId))
      setPresetImportSelection(prev => prev.filter(id => id !== deletePresetId))
      router.refresh()
      setIsPresetDeleteDialogOpen(false)
      setDeletePresetId(null)
      setDeletePresetName(null)
    } catch (error: unknown) {
      setPresetDeleteError(
        error instanceof Error ? error.message : 'Failed to delete default modifier'
      )
    }
  }

  const openPresetDeleteDialog = (preset: ModifierPreset) => {
    setDeletePresetId(preset.id)
    setDeletePresetName(preset.name)
    setPresetDeleteError(null)
    setIsPresetDeleteDialogOpen(true)
  }

  const handleSaveModifierDrafts = async () => {
    if (!editingItemId) return

    const parsed = parseModifierDraftRows(modifierDraftRows)
    if (!parsed.ok) {
      setItemError(parsed.error)
      return
    }
    if (parsed.modifiers.length === 0) {
      setItemError('Add at least one modifier row with a label before saving.')
      return
    }
    const toSave = parsed.modifiers

    setIsSavingModifiers(true)
    try {
      await addMenuItemModifiersBatch(editingItemId, toSave, restaurantSlug)
      setItemError(null)
      setModifierDraftRows([createModifierDraftRow()])
      await refreshMenuAfterChange()
      const rows = await getModifiersForMenuItem(editingItemId)
      setModifiers(rows)
    } catch (error: unknown) {
      setItemError(error instanceof Error ? error.message : 'Failed to save modifiers')
    } finally {
      setIsSavingModifiers(false)
    }
  }

  const handleDeleteModifier = async (modifierId: string) => {
    try {
      await deleteMenuItemModifier(modifierId, restaurantSlug)
      setItemError(null)
      await refreshMenuAfterChange()
      if (editingItemId) {
        const rows = await getModifiersForMenuItem(editingItemId)
        setModifiers(rows)
      }
    } catch (error: any) {
      setItemError(error.message || 'Failed to delete modifier')
    }
  }

  const handlecloseItemDialog = (open: boolean) => {
    if (!open) {
      setIsNewItem(false)
      setModifierDraftRows([])
      setPresetImportSelection([])
      setIsPresetImportDialogOpen(false)
    }
    setIsItemDialogOpen(open)
  }

  const calculatePriceRange = (item: any, itemModifiers?: any[]) => {
    const list = itemModifiers || item.modifiers || []

    if (list.length === 0) {
      return formatCurrency(item.price)
    }

    const basePriceWithModifiers = [
      item.price,
      ...list.map((m: any) => item.price + m.price_modifier),
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
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Default modifiers</CardTitle>
            <CardDescription>
              Reuse these on menu items from the import dialog, or add custom rows per item.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => handleOpenPresetDialog()}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add preset
          </Button>
        </CardHeader>
        <CardContent>
          <Accordion
            type="single"
            collapsible
            defaultValue={initialModifierPresets.length > 0 ? 'modifier-presets' : undefined}
            className="w-full"
          >
            <AccordionItem value="modifier-presets">
              <AccordionTrigger className="text-base">
                <div className="flex items-center gap-2">
                  <span>Saved presets</span>
                  <Badge variant="secondary">{modifierPresets.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {modifierPresets.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No presets yet — e.g. drink choice, size.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {modifierPresets.map(p => (
                      <div
                        key={p.id}
                        className="flex flex-col gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex gap-3 flex-1 min-w-0">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <SlidersHorizontal className="h-5 w-5 text-muted-foreground/40" />
                          </div>
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <h3 className="truncate font-semibold">{p.name}</h3>
                            <p className="text-sm font-bold tabular-nums">{formatCurrency(p.price_modifier)}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            aria-label={`Edit default modifier ${p.name}`}
                            onClick={() => handleOpenPresetDialog(p)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            aria-label={`Delete default modifier ${p.name}`}
                            onClick={() => openPresetDeleteDialog(p)}
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
          </Accordion>
        </CardContent>
      </Card>

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
          {toggleError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription className="flex items-center justify-between gap-2">
                <span>{toggleError}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 -m-1"
                  onClick={() => setToggleError(null)}
                >
                  Dismiss
                </Button>
              </AlertDescription>
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
                                  <p className="text-sm font-bold tabular-nums">{calculatePriceRange(item, item.modifiers)}</p>
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
                            <p className="text-lg font-bold">{calculatePriceRange(item, item.modifiers)}</p>
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
            <p className="text-muted-foreground m-0 rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs leading-normal">
              <span className="font-medium text-foreground">Saved.</span>{' '}
              <span className="text-muted-foreground/50" aria-hidden>
                ·{' '}
              </span>
              modifiers <span className="font-medium text-foreground">Save modifiers</span>
              <span className="text-muted-foreground/50" aria-hidden>
                {' '}
                ·{' '}
              </span>
              details <span className="font-medium text-foreground">Save Changes</span>
              <span className="text-muted-foreground/50" aria-hidden>
                {' '}
                ·{' '}
              </span>
              exit <span className="font-medium text-foreground">Done</span>
            </p>
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

            {/* Right column — Modifiers */}
            <div className="space-y-3 sm:border-l sm:pl-6">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Modifiers</p>

              {editingItemId ? (
                <>
                  <p className="text-xs font-medium text-muted-foreground">On this item</p>
                  {modifiers.length === 0 ? (
                    <p className="text-xs text-muted-foreground">None yet.</p>
                  ) : (
                    <div className="overflow-hidden rounded-md border text-sm">
                      <div className="grid grid-cols-[minmax(0,1fr)_6rem_2rem] gap-2 border-b bg-muted/40 px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        <span>Label</span>
                        <span className="text-right">Price</span>
                        <span className="sr-only">Remove</span>
                      </div>
                      {modifiers.map((row: any) => (
                        <div
                          key={row.id}
                          className="grid grid-cols-[minmax(0,1fr)_6rem_2rem] items-center gap-2 border-b px-2 py-1.5 last:border-b-0"
                        >
                          <span className="truncate font-medium">{row.name}</span>
                          <span className="text-right tabular-nums text-muted-foreground">
                            {formatCurrency(row.price_modifier)}
                          </span>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteModifier(row.id)}
                            aria-label={`Remove modifier ${row.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  Rows below save with <strong className="font-medium text-foreground">Create item</strong> · use{' '}
                  <strong className="font-medium text-foreground">0</strong> for no price change.
                </p>
              )}

              <p className="text-xs font-medium text-muted-foreground">Draft rows</p>
              <div className="overflow-hidden rounded-md border">
                <div className="grid grid-cols-1 gap-2 border-b bg-muted/40 px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:grid-cols-[minmax(0,1fr)_6.75rem_auto]">
                  <span>Label</span>
                  <span className="sm:text-right">Price (PHP)</span>
                  <span className="hidden w-8 sm:inline" aria-hidden />
                </div>
                <div className="divide-y">
                  {modifierDraftRows.map(row => (
                    <div
                      key={row.id}
                      className="grid grid-cols-1 gap-2 px-2 py-1.5 sm:grid-cols-[minmax(0,1fr)_6.75rem_auto] sm:items-center"
                    >
                      <Input
                        value={row.name}
                        onChange={e =>
                          setModifierDraftRows(prev =>
                            prev.map(r =>
                              r.id === row.id ? { ...r, name: e.target.value } : r
                            )
                          )
                        }
                        placeholder="e.g. Coke / Large"
                        className="h-8 text-sm"
                      />
                      <Input
                        type="number"
                        value={row.priceDelta}
                        onChange={e =>
                          setModifierDraftRows(prev =>
                            prev.map(r =>
                              r.id === row.id ? { ...r, priceDelta: e.target.value } : r
                            )
                          )
                        }
                        placeholder="0"
                        className="h-8 text-sm"
                        step="0.01"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive sm:place-self-auto"
                        aria-label="Remove row"
                        onClick={() =>
                          setModifierDraftRows(prev =>
                            prev.length <= 1 ? prev : prev.filter(r => r.id !== row.id)
                          )
                        }
                        disabled={modifierDraftRows.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs sm:text-sm"
                  onClick={openPresetImportDialog}
                  disabled={modifierPresets.length === 0}
                >
                  Import default modifiers…
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs sm:text-sm"
                  onClick={() =>
                    setModifierDraftRows(prev => [...prev, createModifierDraftRow()])
                  }
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add row
                </Button>
                {editingItemId ? (
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 text-xs sm:text-sm"
                    onClick={handleSaveModifierDrafts}
                    disabled={isSavingModifiers}
                  >
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    {isSavingModifiers ? 'Saving…' : 'Save modifiers'}
                  </Button>
                ) : null}
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
            <Button onClick={handleCreateOrUpdateItem} className="flex-1" disabled={isUploadingImage || isSavingItem}>
              {isUploadingImage
                ? 'Uploading...'
                : isSavingItem
                  ? editingItemId
                    ? 'Saving...'
                    : 'Creating...'
                  : editingItemId
                    ? 'Save Changes'
                    : 'Create Item'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isPresetImportDialogOpen}
        onOpenChange={open => {
          setIsPresetImportDialogOpen(open)
          if (!open) setPresetImportSelection([])
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import default modifiers</DialogTitle>
            <DialogDescription>
              Select any number of presets. They will be appended as editable draft rows.
            </DialogDescription>
          </DialogHeader>
          {modifierPresets.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No defaults defined yet. Add defaults in the accordion above first.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={selectAllPresetImports}
                >
                  Select all
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={clearPresetImportSelection}
                >
                  Clear
                </Button>
              </div>
              <div className="max-h-[min(280px,50dvh)] space-y-0.5 overflow-y-auto rounded-md border p-2">
                {modifierPresets.map(p => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-1.5 text-sm hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={presetImportSelection.includes(p.id)}
                      onChange={() => togglePresetImportSelection(p.id)}
                      className="h-4 w-4 shrink-0 rounded border-input accent-primary"
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatCurrency(p.price_modifier)}
                    </span>
                  </label>
                ))}
              </div>
            </>
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsPresetImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirmPresetBatchImport}
              disabled={presetImportSelection.length === 0 || modifierPresets.length === 0}
            >
              Import{presetImportSelection.length > 0 ? ` (${presetImportSelection.length})` : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPresetDialogOpen} onOpenChange={setIsPresetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPreset ? 'Edit default modifier' : 'New default modifier'}</DialogTitle>
            <DialogDescription>
              {editingPreset
                ? 'Update the label and price adjustment for this preset.'
                : 'Create a reusable option (e.g. drink choice, size). Add it to menu items from the modifiers section.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {presetFormError && (
              <Alert variant="destructive">
                <AlertDescription>{presetFormError}</AlertDescription>
              </Alert>
            )}
            <div>
              <Label htmlFor="preset-name">Label</Label>
              <Input
                id="preset-name"
                value={presetFormName}
                onChange={e => setPresetFormName(e.target.value)}
                placeholder="e.g. Large / Sprite"
                className="mt-1"
                maxLength={50}
              />
            </div>
            <div>
              <Label htmlFor="preset-price">Price adjustment (PHP)</Label>
              <Input
                id="preset-price"
                type="number"
                value={presetFormPrice}
                onChange={e => setPresetFormPrice(e.target.value)}
                placeholder="0"
                className="mt-1"
                step="0.01"
              />
              <p className="mt-1 text-xs text-muted-foreground">Use 0 when this option does not change the item price.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsPresetDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSavePreset}
                className="flex-1"
                disabled={presetSaving || !presetFormName.trim()}
              >
                {presetSaving ? 'Saving…' : editingPreset ? 'Save' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isPresetDeleteDialogOpen}
        onOpenChange={open => {
          setIsPresetDeleteDialogOpen(open)
          if (!open) {
            setPresetDeleteError(null)
            setDeletePresetId(null)
            setDeletePresetName(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete default modifier</DialogTitle>
            <DialogDescription>
              Remove &ldquo;{deletePresetName ?? 'this preset'}&rdquo;? Menu items that already have this text saved are
              not changed.
            </DialogDescription>
          </DialogHeader>
          {presetDeleteError && (
            <Alert variant="destructive">
              <AlertDescription>{presetDeleteError}</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPresetDeleteDialogOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePreset} className="flex-1">
              Delete
            </Button>
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

