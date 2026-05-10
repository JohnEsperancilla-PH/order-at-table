'use client'

import { useMemo, useState, type MouseEvent } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus, Minus, Check, ShoppingBag } from 'lucide-react'
import { CartItem, MenuCategory, MenuItem } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

function normalizeInstructions(s?: string | null) {
  return (s || '').trim()
}

interface MenuAccordionProps {
  categories: MenuCategory[]
  menuItems: any[]
  cart: CartItem[]
  onAddToCart: (item: MenuItem, modifierId?: string | null, specialInstructions?: string | null) => void
  onUpdateQuantity: (lineId: string, quantity: number) => void
}

export function MenuAccordion({ categories, menuItems, cart, onAddToCart, onUpdateQuantity }: MenuAccordionProps) {
  const [openCategory, setOpenCategory] = useState<string | undefined>(categories[0]?.id)
  const [detailItem, setDetailItem] = useState<any | null>(null)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [selectedModifierId, setSelectedModifierId] = useState<string | null>(null)
  const [modifierSheetNotes, setModifierSheetNotes] = useState('')
  const [isModifierSheetOpen, setIsModifierSheetOpen] = useState(false)

  const primaryPlainLine = useMemo(() => {
    if (!detailItem) return null
    const lines = cart.filter(
      ci =>
        ci.menu_item.id === detailItem.id &&
        !ci.modifier_id &&
        normalizeInstructions(ci.special_instructions) === ''
    )
    return lines.length === 1 ? lines[0] : null
  }, [detailItem, cart])

  const getCartQuantityForItem = (itemId: string): number => {
    return cart.filter(ci => ci.menu_item.id === itemId).reduce((sum, ci) => sum + ci.quantity, 0)
  }

  const linesForItemWithoutModifier = (itemId: string) =>
    cart.filter(ci => ci.menu_item.id === itemId && !ci.modifier_id)

  const getCartQuantityForModifier = (itemId: string, modifierId: string | null): number => {
    return cart
      .filter(ci => ci.menu_item.id === itemId && (ci.modifier_id || null) === (modifierId || null))
      .reduce((sum, ci) => sum + ci.quantity, 0)
  }

  const calculatePriceRange = (item: any) => {
    const modifiers = item.modifiers || []

    if (modifiers.length === 0) {
      return formatCurrency(item.price)
    }

    const basePriceWithModifiers = [
      item.price,
      ...modifiers.map((m: any) => item.price + m.price_modifier),
    ]

    const minPrice = Math.min(...basePriceWithModifiers)
    const maxPrice = Math.max(...basePriceWithModifiers)

    if (minPrice === maxPrice) {
      return formatCurrency(minPrice)
    }

    return `${formatCurrency(minPrice)} – ${formatCurrency(maxPrice)}`
  }

  const handleAddToCart = (item: any) => {
    const modifiers = item.modifiers || []

    if (modifiers.length === 0) {
      onAddToCart(item, null, null)
      return
    }

    setSelectedItem(item)
    setSelectedModifierId(null)
    setModifierSheetNotes('')
    setIsModifierSheetOpen(true)
  }

  const handleConfirmModifier = () => {
    if (selectedItem && selectedModifierId) {
      onAddToCart(selectedItem, selectedModifierId, modifierSheetNotes.trim() || null)
      setIsModifierSheetOpen(false)
      setSelectedItem(null)
      setSelectedModifierId(null)
      setModifierSheetNotes('')
    }
  }

  const openModifierSheetForItem = (item: any) => {
    setSelectedItem(item)
    setSelectedModifierId(null)
    setModifierSheetNotes('')
    setIsModifierSheetOpen(true)
  }

  const itemHasDescription = (item: any) => Boolean(item?.description?.trim())

  const handleLearnMore = (item: any, event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setDetailItem(item)
  }

  const getModifierPriceDisplay = (item: any, modifierId: string | null) => {
    if (!modifierId || !item.modifiers) return formatCurrency(item.price)

    const mod = item.modifiers.find((m: any) => m.id === modifierId)
    if (!mod) return formatCurrency(item.price)

    return formatCurrency(item.price + mod.price_modifier)
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
              <AccordionTrigger className="rounded-lg px-1 text-base">
                <div className="flex items-center gap-2">
                  <span>{category.name}</span>
                  <Badge variant="secondary" className="text-[11px]">
                    {items.length}
                  </Badge>
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
                      const modifiers = item.modifiers || []
                      const hasModifiers = modifiers.length > 0
                      const plainLines = linesForItemWithoutModifier(item.id)
                      const singlePlainLine = plainLines.length === 1 ? plainLines[0] : null
                      const showQuantityStepper = !hasModifiers && !!singlePlainLine

                      return (
                        <Card
                          key={item.id}
                          className={`overflow-hidden border-border/70 transition-all duration-200 hover:border-primary/30 hover:shadow-md active:scale-[0.99] !pt-0 !gap-0 ${
                            item.is_available ? '' : 'opacity-50 grayscale'
                          }`}
                        >
                          <div className="flex items-stretch gap-3.5 p-3.5">
                            {item.image_url && (
                              <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-muted">
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

                            <div className="flex min-w-0 flex-1">
                              <div className="flex w-full items-stretch justify-between gap-2">
                                <div className="flex min-w-0 flex-1 flex-col justify-between gap-1 py-0.5">
                                  <div className="min-w-0">
                                    <h4 className="line-clamp-2 text-[15px] font-semibold leading-tight">{item.name}</h4>
                                    {item.description?.trim() && (
                                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-snug">
                                        {item.description.trim()}
                                      </p>
                                    )}
                                    {itemHasDescription(item) && (
                                      <Button
                                        type="button"
                                        variant="link"
                                        className="h-auto py-0 px-0 mt-0.5 text-xs font-semibold underline-offset-2"
                                        onClick={e => handleLearnMore(item, e)}
                                      >
                                        Learn more
                                      </Button>
                                    )}
                                  </div>
                                  <div>
                                    <span className="text-sm font-bold text-primary">
                                      {calculatePriceRange(item)}
                                    </span>
                                    {hasModifiers && (
                                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                        Choose option
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="shrink-0">
                                  {showQuantityStepper && inCartQty > 0 ? (
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-7 w-7 rounded-full"
                                        onClick={() =>
                                          singlePlainLine &&
                                          onUpdateQuantity(singlePlainLine.lineId, singlePlainLine.quantity - 1)
                                        }
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
                                        onClick={() => onAddToCart(item, null, null)}
                                      >
                                        <Plus className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => handleAddToCart(item)}
                                      disabled={!item.is_available}
                                      className="h-8 rounded-full px-3.5 text-xs font-semibold transition-transform active:scale-95"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Add
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {!item.image_url && inCartQty > 0 && (
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-muted/50">
                                  <span className="text-xs text-muted-foreground">{inCartQty} in cart</span>
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

      <Dialog
        open={!!detailItem}
        onOpenChange={open => {
          if (!open) setDetailItem(null)
        }}
      >
        <DialogContent className="max-h-[min(85dvh,640px)] w-[calc(100%-1.5rem)] max-w-md gap-0 overflow-hidden p-0 flex flex-col sm:rounded-2xl border shadow-2xl">
          {detailItem && (
            <>
              <div className="relative shrink-0 aspect-[16/10] w-full bg-muted overflow-hidden sm:aspect-[16/9]">
                {detailItem.image_url ? (
                  <img
                    src={detailItem.image_url}
                    alt={detailItem.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full min-h-[140px] items-center justify-center text-sm text-muted-foreground">
                    No photo
                  </div>
                )}
                {!detailItem.is_available && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
                    <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold">Sold out</span>
                  </div>
                )}
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-4 pb-2">
                <DialogHeader className="space-y-2 text-left">
                  <DialogTitle className="text-xl leading-tight pr-8">{detailItem.name}</DialogTitle>
                  <p className="text-sm font-semibold text-primary tabular-nums">
                    {calculatePriceRange(detailItem)}
                  </p>
                </DialogHeader>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {detailItem.description?.trim()}
                </p>
              </div>

              <div className="shrink-0 border-t bg-background px-4 py-3 space-y-2">
                {(detailItem.modifiers || []).length > 0 ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      Pick drink, size, or add-on on the next step.
                      {getCartQuantityForItem(detailItem.id) > 0 && (
                        <span className="ml-1 font-medium text-foreground">
                          ({getCartQuantityForItem(detailItem.id)} in cart)
                        </span>
                      )}
                    </p>
                    <Button
                      className="h-11 w-full rounded-xl text-base"
                      disabled={!detailItem.is_available}
                      onClick={() => {
                        const item = detailItem
                        setDetailItem(null)
                        openModifierSheetForItem(item)
                      }}
                    >
                      Choose options &amp; add
                    </Button>
                  </>
                ) : primaryPlainLine && primaryPlainLine.quantity > 0 ? (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-muted-foreground">In cart</span>
                    <div className="flex items-center gap-2 rounded-full border bg-muted/40 p-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 rounded-full"
                        disabled={!detailItem.is_available}
                        aria-label="Decrease quantity"
                        onClick={() => onUpdateQuantity(primaryPlainLine.lineId, primaryPlainLine.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="min-w-[2rem] text-center text-sm font-bold tabular-nums">
                        {primaryPlainLine.quantity}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="default"
                        className="h-9 w-9 rounded-full"
                        disabled={!detailItem.is_available}
                        aria-label="Increase quantity"
                        onClick={() => onAddToCart(detailItem, null, null)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    className="h-11 w-full rounded-xl text-base"
                    disabled={!detailItem.is_available}
                    onClick={() => onAddToCart(detailItem, null, null)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add to cart
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Sheet open={isModifierSheetOpen} onOpenChange={setIsModifierSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-w-md rounded-t-2xl px-4 pb-6 pt-5 md:bottom-[calc(50%-420px+0.75rem)] md:left-1/2 md:w-[calc(28rem-1.5rem)] md:max-w-[calc(28rem-1.5rem)] md:-translate-x-1/2 md:rounded-2xl md:border md:shadow-2xl"
        >
          <SheetHeader className="mb-5 px-0">
            <SheetTitle className="text-left text-lg">{selectedItem?.name}</SheetTitle>
            <SheetDescription className="text-left text-sm">
              Pick an option (e.g. drink choice or size), then add allergy or kitchen notes if needed.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5">
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
              <p className="text-sm font-semibold mb-3">Choose an option</p>
              <div className="space-y-2">
                {selectedItem?.modifiers?.map((mod: any) => {
                  const isSelected = selectedModifierId === mod.id
                  const modQty = selectedItem ? getCartQuantityForModifier(selectedItem.id, mod.id) : 0

                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => setSelectedModifierId(mod.id)}
                      className={`w-full px-3 py-3 rounded-lg border-2 transition-all duration-150 text-left active:scale-[0.98] ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-primary/40 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                          </div>
                          <div>
                            <span className="font-medium text-sm">{mod.name}</span>
                            {modQty > 0 && (
                              <span className="ml-2 text-xs text-primary font-medium">{modQty} in cart</span>
                            )}
                          </div>
                        </div>
                        <span className="font-bold tabular-nums text-sm">
                          {formatCurrency(selectedItem.price + mod.price_modifier)}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modifier-sheet-notes" className="text-sm">
                Allergies &amp; special requests (optional)
              </Label>
              <Textarea
                id="modifier-sheet-notes"
                value={modifierSheetNotes}
                onChange={e => setModifierSheetNotes(e.target.value)}
                placeholder="e.g. peanut allergy — no nuts; well done; extra sauce on the side"
                className="min-h-[88px] resize-none text-sm"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsModifierSheetOpen(false)}
                className="flex-1 rounded-xl h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmModifier}
                disabled={!selectedModifierId}
                className="flex-1 rounded-xl h-11 transition-transform active:scale-[0.97]"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Add
                {selectedModifierId ? ` · ${getModifierPriceDisplay(selectedItem, selectedModifierId)}` : ''}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
