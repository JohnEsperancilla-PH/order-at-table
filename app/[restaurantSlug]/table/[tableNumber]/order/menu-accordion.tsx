'use client'

import { useMemo, useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Plus, Minus, Check, ShoppingBag } from 'lucide-react'
import { CartItem, MenuCategory, MenuItem } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

interface MenuAccordionProps {
  categories: MenuCategory[]
  menuItems: any[]
  cart: CartItem[]
  onAddToCart: (item: MenuItem, sizeId?: string | null) => void
  onUpdateQuantity: (itemId: string, quantity: number, sizeId?: string | null) => void
}

export function MenuAccordion({ categories, menuItems, cart, onAddToCart, onUpdateQuantity }: MenuAccordionProps) {
  const [openCategory, setOpenCategory] = useState<string | undefined>(categories[0]?.id)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [isSizeSheetOpen, setIsSizeSheetOpen] = useState(false)

  // Get total quantity in cart for a given item (across all sizes)
  const getCartQuantityForItem = (itemId: string): number => {
    return cart
      .filter(ci => ci.menu_item.id === itemId)
      .reduce((sum, ci) => sum + ci.quantity, 0)
  }

  // Get cart entry for a specific item+size combo
  const getCartEntry = (itemId: string, sizeId?: string | null): CartItem | undefined => {
    return cart.find(
      ci => ci.menu_item.id === itemId && (ci.size_id || null) === (sizeId || null)
    )
  }

  const calculatePriceRange = (item: any) => {
    const sizes = item.sizes || []
    
    if (sizes.length === 0) {
      // No sizes, just return base price
      return formatCurrency(item.price)
    }
    
    // Calculate min and max with price modifiers
    const basePriceWithModifiers = [
      item.price,
      ...sizes.map((s: any) => item.price + s.price_modifier)
    ]
    
    const minPrice = Math.min(...basePriceWithModifiers)
    const maxPrice = Math.max(...basePriceWithModifiers)
    
    if (minPrice === maxPrice) {
      return formatCurrency(minPrice)
    }
    
    return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`
  }

  const handleAddToCart = (item: any) => {
    const sizes = item.sizes || []
    
    if (sizes.length === 0) {
      // No sizes, add directly
      onAddToCart(item, null)
    } else {
      // Show size selection sheet
      setSelectedItem(item)
      setSelectedSize(null)
      setIsSizeSheetOpen(true)
    }
  }

  const handleConfirmSize = () => {
    if (selectedItem) {
      onAddToCart(selectedItem, selectedSize)
      setIsSizeSheetOpen(false)
      setSelectedItem(null)
      setSelectedSize(null)
    }
  }

  const getSizePriceDisplay = (item: any, sizeId: string | null) => {
    if (!sizeId || !item.sizes) return formatCurrency(item.price)
    
    const size = item.sizes.find((s: any) => s.id === sizeId)
    if (!size) return formatCurrency(item.price)
    
    return formatCurrency(item.price + size.price_modifier)
  }

  const itemsByCategory = useMemo(() => {
    const grouped = new Map<string, MenuItem[]>()
    categories.forEach(category => {
      grouped.set(category.id, [])
    })
    menuItems.forEach(item => {
      if (!grouped.has(item.category_id)) {
        grouped.set(item.category_id, [])
      }
      grouped.get(item.category_id)?.push(item)
    })
    return grouped
  }, [categories, menuItems])

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No categories available yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Accordion
        type="single"
        collapsible
        value={openCategory}
        onValueChange={setOpenCategory}
        className="w-full"
      >
        {categories.map(category => {
          const items = itemsByCategory.get(category.id) || []

          return (
            <AccordionItem key={category.id} value={category.id}>
              <AccordionTrigger className="text-base">
                <div className="flex items-center gap-2">
                  <span>{category.name}</span>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {items.length === 0 ? (
                  <Card>
                    <CardContent className="py-6 text-center text-muted-foreground">
                      No items in this category.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {items.map(item => {
                      const inCartQty = getCartQuantityForItem(item.id)
                      const hasSizes = (item.sizes || []).length > 0

                      return (
                        <Card
                          key={item.id}
                          className={`overflow-hidden transition-all duration-200 hover:shadow-md active:scale-[0.99] !pt-0 !gap-0 ${
                            item.is_available ? '' : 'opacity-50 grayscale'
                          }`}
                        >
                          {/* Horizontal layout for 9:16 optimization */}
                          <div className="flex gap-3 p-3">
                            {/* Compact image */}
                            {item.image_url && (
                              <div className="relative w-16 h-16 overflow-hidden bg-muted rounded-lg shrink-0">
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                                {inCartQty > 0 && (
                                  <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                                    {inCartQty}
                                  </div>
                                )}
                                {!item.is_available && (
                                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                                    <span className="text-xs font-medium">Sold Out</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Content area */}
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm leading-tight mb-1 line-clamp-1">{item.name}</h4>
                                  {item.description && (
                                    <p className="text-xs text-muted-foreground leading-snug mb-2 line-clamp-1">
                                      {item.description}
                                    </p>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="text-sm font-bold text-primary">
                                        {calculatePriceRange(item)}
                                      </span>
                                      {hasSizes && (
                                        <p className="text-[10px] text-muted-foreground">Choose size</p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Add/quantity controls */}
                                <div className="shrink-0">
                                  {!hasSizes && inCartQty > 0 ? (
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-7 w-7 rounded-full"
                                        onClick={() => onUpdateQuantity(item.id, inCartQty - 1, null)}
                                      >
                                        <Minus className="w-3 h-3" />
                                      </Button>
                                      <span className="w-4 text-center text-xs font-semibold tabular-nums">
                                        {inCartQty}
                                      </span>
                                      <Button
                                        size="icon"
                                        variant="default"
                                        className="h-7 w-7 rounded-full"
                                        onClick={() => onAddToCart(item, null)}
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => handleAddToCart(item)}
                                      disabled={!item.is_available}
                                      className="rounded-full px-3 h-7 text-xs transition-transform active:scale-95"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Add
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Show cart controls if no image and has cart items */}
                              {!item.image_url && inCartQty > 0 && (
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-muted/50">
                                  <span className="text-xs text-muted-foreground">
                                    {inCartQty} in cart
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      <Sheet open={isSizeSheetOpen} onOpenChange={setIsSizeSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-6 pt-5 max-w-md mx-auto">
          <SheetHeader className="mb-5 px-0">
            <SheetTitle className="text-left text-lg">{selectedItem?.name}</SheetTitle>
            {selectedItem?.description && (
              <SheetDescription className="text-left text-sm">
                {selectedItem.description}
              </SheetDescription>
            )}
          </SheetHeader>

          <div className="space-y-5">
            {/* Compact item image preview */}
            {selectedItem?.image_url && (
              <div className="rounded-xl overflow-hidden">
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.name}
                  className="h-24 w-full object-cover"
                />
              </div>
            )}

            <div>
              <p className="text-sm font-semibold mb-3">Choose a size</p>
              <div className="space-y-2">
                {selectedItem?.sizes?.map((size: any) => {
                  const isSelected = selectedSize === size.id
                  const cartEntry = selectedItem ? getCartEntry(selectedItem.id, size.id) : undefined
                  
                  return (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size.id)}
                      className={`w-full px-3 py-3 rounded-lg border-2 transition-all duration-150 text-left active:scale-[0.98] ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-primary/40 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                          </div>
                          <div>
                            <span className="font-medium text-sm">{size.name}</span>
                            {cartEntry && (
                              <span className="ml-2 text-xs text-primary font-medium">
                                {cartEntry.quantity} in cart
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-bold tabular-nums text-sm">
                          {formatCurrency(selectedItem.price + size.price_modifier)}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsSizeSheetOpen(false)}
                className="flex-1 rounded-xl h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSize}
                disabled={!selectedSize}
                className="flex-1 rounded-xl h-11 transition-transform active:scale-[0.97]"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Add{selectedSize ? ` · ${getSizePriceDisplay(selectedItem, selectedSize)}` : ''}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
