"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Minus, Plus, Trash2, Search, ShoppingCart, User, Hash } from 'lucide-react'
import { createOrder } from '@/lib/actions/orders'
import { formatCurrency } from '@/lib/utils'

interface CounterOrderFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tables: any[]
  menuItems: any[]
  onOrderCreated: () => void
}

interface CartItem {
  menu_item: any
  quantity: number
  size_id: string | null
  size?: any
}

export function CounterOrderForm({ open, onOpenChange, tables, menuItems, onOrderCreated }: CounterOrderFormProps) {
  const [selectedTableId, setSelectedTableId] = useState<string>('')
  const [customerName, setCustomerName] = useState<string>('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingSubmissionKey, setPendingSubmissionKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [sizePickerItem, setSizePickerItem] = useState<any | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Group menu items by category
  const categorizedItems = useMemo(() => {
    const categories: Record<string, { name: string; items: any[] }> = {}
    menuItems.forEach(item => {
      const catName = item.menu_categories?.name || 'Other'
      const catId = item.category_id || 'other'
      if (!categories[catId]) {
        categories[catId] = { name: catName, items: [] }
      }
      categories[catId].items.push(item)
    })
    return categories
  }, [menuItems])

  // Set initial active category
  useEffect(() => {
    if (!activeCategory && Object.keys(categorizedItems).length > 0) {
      setActiveCategory(Object.keys(categorizedItems)[0])
    }
  }, [categorizedItems, activeCategory])

  const filteredMenuItems = useMemo(() => {
    if (searchQuery.trim()) {
      return menuItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    if (activeCategory && categorizedItems[activeCategory]) {
      return categorizedItems[activeCategory].items
    }
    return menuItems
  }, [menuItems, searchQuery, activeCategory, categorizedItems])

  const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart])

  const getItemPrice = useCallback((item: CartItem): number => {
    const basePrice = item.menu_item.price
    const sizeAdjustment = item.size?.price_modifier || 0
    return basePrice + sizeAdjustment
  }, [])

  const totalAmount = useMemo(
    () => cart.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0),
    [cart, getItemPrice]
  )

  // Check if item is already in cart (any size)
  const getCartQuantity = useCallback((itemId: string): number => {
    return cart.filter(ci => ci.menu_item.id === itemId).reduce((sum, ci) => sum + ci.quantity, 0)
  }, [cart])

  const addToCart = useCallback((item: any, sizeId: string | null = null) => {
    setCart(prev => {
      const existing = prev.find(ci => ci.menu_item.id === item.id && (ci.size_id || null) === (sizeId || null))
      if (existing) {
        return prev.map(ci =>
          ci.menu_item.id === item.id && (ci.size_id || null) === (sizeId || null)
            ? { ...ci, quantity: ci.quantity + 1 }
            : ci
        )
      }
      const size = item.sizes?.find((s: any) => s.id === sizeId)
      return [...prev, { menu_item: item, quantity: 1, size_id: sizeId, size }]
    })
  }, [])

  const removeFromCart = useCallback((itemId: string, sizeId: string | null = null) => {
    setCart(prev => prev.filter(ci => !(ci.menu_item.id === itemId && (ci.size_id || null) === (sizeId || null))))
  }, [])

  const updateQuantity = useCallback((itemId: string, quantity: number, sizeId: string | null = null) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(ci => !(ci.menu_item.id === itemId && (ci.size_id || null) === (sizeId || null))))
      return
    }
    setCart(prev =>
      prev.map(ci =>
        ci.menu_item.id === itemId && (ci.size_id || null) === (sizeId || null)
          ? { ...ci, quantity }
          : ci
      )
    )
  }, [])

  const handleMenuItemClick = useCallback((item: any) => {
    if (item.sizes && item.sizes.length > 0) {
      setSizePickerItem(item)
      return
    }
    addToCart(item, null)
  }, [addToCart])

  const resetForm = useCallback(() => {
    setSelectedTableId('')
    setCustomerName('')
    setCart([])
    setSearchQuery('')
    setError(null)
    setPendingSubmissionKey(null)
    setActiveCategory(Object.keys(categorizedItems)[0] || null)
  }, [categorizedItems])

  const handleSubmit = async () => {
    setError(null)
    const submissionKey = pendingSubmissionKey || crypto.randomUUID()
    if (!pendingSubmissionKey) {
      setPendingSubmissionKey(submissionKey)
    }

    if (!selectedTableId) {
      setError('Please select a table')
      return
    }
    if (!customerName.trim()) {
      setError('Please enter customer name')
      return
    }
    if (cart.length === 0) {
      setError('Please add items to the order')
      return
    }

    setIsSubmitting(true)
    try {
      const selectedTable = tables.find(t => t.id === selectedTableId)
      if (!selectedTable) {
        setError('Selected table not found')
        return
      }

      const orderItems = cart.map(item => ({
        menu_item_id: item.menu_item.id,
        quantity: item.quantity,
        price: getItemPrice(item),
      }))

      await createOrder(
        selectedTableId,
        selectedTable.restaurant_id,
        orderItems,
        undefined,
        undefined,
        customerName.trim(),
        submissionKey
      )

      resetForm()
      setPendingSubmissionKey(null)
      onOpenChange(false)
      onOrderCreated()
    } catch (err: any) {
      setError(err.message || 'Failed to create order')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) resetForm()
    onOpenChange(val)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-0">
          <DialogTitle className="text-lg">New Counter Order</DialogTitle>
          <DialogDescription>
            Add items and submit the order
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="py-2">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 flex-1 min-h-0 overflow-hidden">
          {/* Left column — Menu items (3/5 width) */}
          <div className="sm:col-span-3 flex flex-col min-h-0 gap-3">
            {/* Compact info row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Customer name"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <Select value={selectedTableId} onValueChange={setSelectedTableId}>
                <SelectTrigger className="h-9 text-sm">
                  <Hash className="w-3.5 h-3.5 text-muted-foreground mr-1" />
                  <SelectValue placeholder="Table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map(table => (
                    <SelectItem key={table.id} value={table.id}>
                      Table {table.table_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search menu..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>

            {/* Category tabs */}
            {!searchQuery.trim() && (
              <ScrollArea className="w-full">
                <div className="flex gap-1.5 pb-1">
                  {Object.entries(categorizedItems).map(([catId, cat]) => (
                    <Button
                      key={catId}
                      variant={activeCategory === catId ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 px-3 text-xs whitespace-nowrap shrink-0"
                      onClick={() => setActiveCategory(catId)}
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Menu items list */}
            <ScrollArea className="flex-1 border rounded-lg">
              <div className="p-2 space-y-1">
                {filteredMenuItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-12 text-center">No items found</p>
                ) : (
                  filteredMenuItems.map(item => {
                    const qty = getCartQuantity(item.id)
                    const hasSizes = item.sizes && item.sizes.length > 0
                    return (
                      <div
                        key={item.id}
                        className="group flex items-center gap-3 p-2 rounded-lg bg-muted hover:bg-muted/80 transition cursor-pointer"
                        onClick={() => handleMenuItemClick(item)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            {qty > 0 && (
                              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-bold">
                                {qty}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-muted-foreground">
                              {hasSizes
                                ? `${formatCurrency(item.price + (item.sizes[0].price_modifier || 0))} – ${formatCurrency(item.price + (item.sizes[item.sizes.length - 1].price_modifier || 0))}`
                                : formatCurrency(item.price)
                              }
                            </p>
                            {hasSizes && (
                              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {item.sizes.length} sizes
                              </span>
                            )}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right column — Cart (2/5 width) */}
          <div className="sm:col-span-2 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Cart</span>
              </div>
              {cartItemCount > 0 && (
                <Badge variant="secondary" className="h-5 text-xs">
                  {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                </Badge>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-dashed text-muted-foreground gap-2 min-h-[200px]">
                <ShoppingCart className="w-8 h-8 opacity-30" />
                <p className="text-sm">Add items from the menu</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1 min-h-0">
                  <div className="space-y-1 pr-2">
                    {cart.map(item => {
                      const itemPrice = getItemPrice(item)
                      return (
                        <div
                          key={`${item.menu_item.id}-${item.size_id || 'base'}`}
                          className="flex items-start gap-2 p-2 rounded-md bg-muted/40 text-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm leading-tight truncate">{item.menu_item.name}</p>
                            {item.size && (
                              <p className="text-[11px] text-muted-foreground">{item.size.name}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatCurrency(itemPrice)} ea
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => updateQuantity(item.menu_item.id, item.quantity - 1, item.size_id)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-5 text-center text-xs font-medium tabular-nums">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => updateQuantity(item.menu_item.id, item.quantity + 1, item.size_id)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-xs font-semibold tabular-nums w-14 text-right">
                              {formatCurrency(itemPrice * item.quantity)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => removeFromCart(item.menu_item.id, item.size_id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>

                <Separator className="my-2" />

                <div className="flex items-center justify-between py-1 font-bold text-sm">
                  <span>Total</span>
                  <span className="tabular-nums text-base">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-3 mt-auto">
              <Button
                variant="outline"
                className="flex-1 h-9 text-sm"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-9 text-sm"
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedTableId || !customerName.trim() || cart.length === 0}
              >
                {isSubmitting ? 'Creating...' : `Place Order${totalAmount > 0 ? ` · ${formatCurrency(totalAmount)}` : ''}`}
              </Button>
            </div>
          </div>
        </div>

        {/* Size Picker Dialog */}
        {sizePickerItem && (
          <Dialog open={!!sizePickerItem} onOpenChange={(val) => { if (!val) setSizePickerItem(null) }}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>{sizePickerItem.name}</DialogTitle>
                <DialogDescription>Select a size to add</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                {sizePickerItem.sizes.map((size: any) => {
                  const sizePrice = sizePickerItem.price + (size.price_modifier || 0)
                  const cartEntry = cart.find(ci => ci.menu_item.id === sizePickerItem.id && ci.size_id === size.id)
                  return (
                    <button
                      key={size.id}
                      className="flex items-center justify-between w-full p-3 rounded-lg border hover:bg-muted/60 transition text-left"
                      onClick={() => {
                        addToCart(sizePickerItem, size.id)
                        setSizePickerItem(null)
                      }}
                    >
                      <div>
                        <p className="text-sm font-medium">{size.name}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(sizePrice)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {cartEntry && (
                          <Badge variant="secondary" className="text-[10px]">
                            ×{cartEntry.quantity}
                          </Badge>
                        )}
                        <Plus className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </button>
                  )
                })}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}
