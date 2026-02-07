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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          {/* Image with cart quantity overlay */}
                          {item.image_url ? (
                            <div className="relative w-full overflow-hidden bg-muted">
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="h-40 w-full object-cover transition-transform duration-300 hover:scale-105"
                                loading="lazy"
                              />
                              {inCartQty > 0 && (
                                <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                                  {inCartQty}
                                </div>
                              )}
                              {!item.is_available && (
                                <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                                  <Badge variant="secondary" className="text-sm">Sold Out</Badge>
                                </div>
                              )}
                            </div>
                          ) : (
                            inCartQty > 0 && (
                              <div className="flex justify-end px-3 pt-2">
                                <div className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                  {inCartQty}
                                </div>
                              </div>
                            )
                          )}

                          <CardHeader className={`px-3 pb-1 ${item.image_url ? 'pt-3' : inCartQty > 0 ? 'pt-1' : 'pt-3'}`}>
                            <CardTitle className="text-lg font-semibold leading-snug line-clamp-2">{item.name}</CardTitle>
                            {item.description && (
                              <CardDescription className="text-xs line-clamp-2 !mt-0.5">
                                {item.description}
                              </CardDescription>
                            )}
                          </CardHeader>

                          <CardContent className="px-3 pt-0 pb-3">
                            <div className="flex justify-between items-end gap-2">
                              <div className="min-w-0">
                                <span className="text-xl font-bold leading-tight">
                                  {calculatePriceRange(item)}
                                </span>
                                {hasSizes && (
                                  <p className="text-[10px] text-muted-foreground leading-tight">Tap to choose size</p>
                                )}
                              </div>

                              {/* Quantity stepper for no-size items already in cart */}
                              {!hasSizes && inCartQty > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8 rounded-full"
                                    onClick={() => onUpdateQuantity(item.id, inCartQty - 1, null)}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <span className="w-6 text-center text-sm font-semibold">
                                    {inCartQty}
                                  </span>
                                  <Button
                                    size="icon"
                                    variant="default"
                                    className="h-8 w-8 rounded-full"
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
                                  className="rounded-full px-4 transition-transform active:scale-95"
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Add
                                </Button>
                              )}
                            </div>
                          </CardContent>
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
        <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-6 pt-5">
          <SheetHeader className="mb-5 px-0">
            <SheetTitle className="text-left text-lg">{selectedItem?.name}</SheetTitle>
            {selectedItem?.description && (
              <SheetDescription className="text-left">
                {selectedItem.description}
              </SheetDescription>
            )}
          </SheetHeader>

          <div className="space-y-6">
            {/* Item image preview */}
            {selectedItem?.image_url && (
              <div className="rounded-xl overflow-hidden">
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.name}
                  className="h-36 w-full object-cover"
                />
              </div>
            )}

            <div>
              <p className="text-sm font-semibold mb-3">Choose a size</p>
              <div className="space-y-2.5">
                {selectedItem?.sizes?.map((size: any) => {
                  const isSelected = selectedSize === size.id
                  const cartEntry = selectedItem ? getCartEntry(selectedItem.id, size.id) : undefined
                  
                  return (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size.id)}
                      className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-150 text-left active:scale-[0.98] ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-primary/40 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                          <div>
                            <span className="font-medium">{size.name}</span>
                            {cartEntry && (
                              <span className="ml-2 text-xs text-primary font-medium">
                                {cartEntry.quantity} in cart
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-bold tabular-nums">
                          {formatCurrency(selectedItem.price + size.price_modifier)}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => setIsSizeSheetOpen(false)}
                className="flex-1 rounded-xl h-12"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSize}
                disabled={!selectedSize}
                className="flex-1 rounded-xl h-12 transition-transform active:scale-[0.97]"
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
