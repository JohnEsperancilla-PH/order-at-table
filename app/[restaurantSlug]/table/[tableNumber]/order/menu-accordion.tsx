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
import Image from 'next/image'
import { Plus, Minus, Check, ShoppingBag } from 'lucide-react'
import { CartItem, MenuCategory, MenuItem } from '@/lib/types'
import { cn, formatCurrency } from '@/lib/utils'

function normalizeInstructions(s?: string | null) {
  return (s || '').trim()
}

function isSupabasePublicMenuImage(src: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
  return Boolean(base && src.startsWith(`${base}/storage/v1/object/public/`))
}

/** Uses `next/image` when URL is your Supabase public bucket (smaller downloads on slow networks). */
function MenuItemPhoto({
  src,
  alt,
  sizes,
  className,
  priority,
}: {
  src: string
  alt: string
  sizes: string
  className?: string
  priority?: boolean
}) {
  if (isSupabasePublicMenuImage(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={cn('object-cover', className)}
        loading={priority ? undefined : 'lazy'}
        priority={priority}
      />
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      className={cn('h-full w-full object-cover', className)}
      loading={priority ? 'eager' : 'lazy'}
    />
  )
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
              <AccordionTrigger className="px-1 py-3.5 md:py-4 [&>svg]:mt-0.5">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate">{category.name}</span>
                  <Badge variant="secondary" className="shrink-0 tabular-nums text-[11px]">
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
                  <div className="grid grid-cols-1 gap-2 pb-1 md:gap-2.5">
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
                          className={cn(
                            'touch-manipulation overflow-hidden border-border/70 shadow-sm !gap-0 !p-0',
                            'motion-safe:transition-[box-shadow,border-color,opacity,transform]',
                            'motion-safe:duration-200 motion-safe:ease-out',
                            'hover:border-primary/25 hover:shadow-md',
                            'motion-safe:active:scale-[0.997] active:opacity-[0.98]',
                            item.is_available ? '' : 'opacity-55 grayscale-[0.35]',
                          )}
                        >
                          <div className="flex items-stretch gap-3 p-3">
                            {item.image_url && (
                              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted sm:h-[5.25rem] sm:w-[5.25rem]">
                                <MenuItemPhoto
                                  src={item.image_url}
                                  alt={item.name}
                                  sizes="(max-width: 640px) 80px, 84px"
                                />
                                {inCartQty > 0 && (
                                  <div
                                    className="absolute right-1.5 top-1.5 z-[2] flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold tabular-nums text-primary-foreground shadow-md ring-2 ring-background"
                                    aria-label={`${inCartQty} in cart`}
                                  >
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

                            <div
                              className={cn(
                                'flex min-w-0 flex-1 flex-col',
                                item.image_url && 'min-h-[5rem] sm:min-h-[5.25rem]',
                              )}
                            >
                              <div className="min-w-0 flex-1 space-y-1">
                                <h4 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight sm:text-base">
                                  {item.name}
                                </h4>
                                {item.description?.trim() && (
                                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground sm:text-[15px]">
                                    {item.description.trim()}
                                  </p>
                                )}
                                {itemHasDescription(item) && (
                                  <Button
                                    type="button"
                                    variant="link"
                                    className="h-auto min-h-8 justify-start px-0 py-0 text-xs font-semibold underline-offset-4 sm:min-h-7 sm:text-sm"
                                    onClick={e => handleLearnMore(item, e)}
                                  >
                                    Learn more
                                  </Button>
                                )}
                              </div>

                              <div className="mt-auto flex flex-col gap-1.5 pt-3">
                                {!item.image_url && inCartQty > 0 && (
                                  <span className="text-right text-xs text-muted-foreground">
                                    {inCartQty} in cart
                                  </span>
                                )}
                                <div className="flex min-w-0 items-center justify-between gap-3">
                                  <span className="min-w-0 flex-1 text-sm font-bold tabular-nums text-primary sm:text-[15px]">
                                    {calculatePriceRange(item)}
                                  </span>
                                  {showQuantityStepper && inCartQty > 0 ? (
                                    <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-10 w-10 rounded-full touch-manipulation sm:h-8 sm:w-8"
                                        onClick={() =>
                                          singlePlainLine &&
                                          onUpdateQuantity(singlePlainLine.lineId, singlePlainLine.quantity - 1)
                                        }
                                      >
                                        <Minus className="w-4 h-4 sm:h-3 sm:w-3" />
                                      </Button>
                                      <span className="min-w-[1.5rem] text-center text-xs font-semibold tabular-nums">
                                        {inCartQty}
                                      </span>
                                      <Button
                                        size="icon"
                                        variant="default"
                                        className="h-10 w-10 rounded-full touch-manipulation sm:h-8 sm:w-8"
                                        onClick={() => onAddToCart(item, null, null)}
                                      >
                                        <Plus className="w-4 h-4 sm:h-3 sm:w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      className="h-9 min-h-10 shrink-0 touch-manipulation rounded-full px-3 text-[13px] font-semibold motion-safe:transition-transform motion-safe:active:scale-[0.98] sm:h-10 sm:px-4 sm:text-sm"
                                      onClick={() => handleAddToCart(item)}
                                      disabled={!item.is_available}
                                      aria-label={
                                        hasModifiers
                                          ? `Choose options for ${item.name}`
                                          : `Add ${item.name} to cart`
                                      }
                                    >
                                      {hasModifiers ? (
                                        <span className="whitespace-nowrap text-xs sm:text-sm">Choose options</span>
                                      ) : (
                                        <>
                                          <Plus className="mr-1 h-3.5 w-3.5 sm:mr-1.5 sm:h-4 sm:w-4" />
                                          Add
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </div>
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
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-28 bg-gradient-to-b from-black/50 via-black/10 to-transparent"
                  aria-hidden
                />
                {detailItem.image_url ? (
                  <MenuItemPhoto
                    src={detailItem.image_url}
                    alt={detailItem.name}
                    sizes="(max-width: 448px) 100vw, 400px"
                    className={
                      isSupabasePublicMenuImage(detailItem.image_url) ? undefined : 'absolute inset-0 h-full w-full object-cover'
                    }
                    priority
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

              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
                <DialogHeader className="space-y-2 pr-10 text-left">
                  <DialogTitle className="text-xl font-bold leading-tight tracking-tight sm:text-2xl">
                    {detailItem.name}
                  </DialogTitle>
                  <p className="text-sm font-semibold tabular-nums text-primary sm:text-base">
                    {calculatePriceRange(detailItem)}
                  </p>
                </DialogHeader>
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap sm:text-[15px] sm:leading-relaxed">
                  {detailItem.description?.trim()}
                </p>
              </div>

              <div className="shrink-0 space-y-3 border-t bg-background px-4 py-3.5 sm:px-5 sm:py-4">
                {(detailItem.modifiers || []).length > 0 ? (
                  <>
                    <p className="text-sm leading-snug text-muted-foreground">
                      Pick drink, size, or add-on on the next step.
                      {getCartQuantityForItem(detailItem.id) > 0 && (
                        <span className="ml-1 font-medium text-foreground">
                          ({getCartQuantityForItem(detailItem.id)} in cart)
                        </span>
                      )}
                    </p>
                    <Button
                      className="h-11 w-full rounded-xl text-sm font-semibold shadow-sm sm:h-11 sm:text-base"
                      disabled={!detailItem.is_available}
                      onClick={() => {
                        const item = detailItem
                        setDetailItem(null)
                        openModifierSheetForItem(item)
                      }}
                    >
                      Continue to options
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
                    className="h-11 w-full rounded-xl text-sm font-semibold sm:h-12 sm:text-base"
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
          className="flex max-h-[min(88dvh,720px)] flex-col gap-0 rounded-t-2xl px-4 pb-0 pt-3 md:bottom-[calc(50%-420px+0.75rem)] md:left-1/2 md:w-[calc(28rem-1.5rem)] md:max-w-[calc(28rem-1.5rem)] md:-translate-x-1/2 md:rounded-2xl md:border md:pb-0 md:shadow-2xl"
        >
          <div
            className="mx-auto mb-2 shrink-0 h-1 w-11 rounded-full bg-muted-foreground/20"
            aria-hidden
          />
          <SheetHeader className="mb-2 shrink-0 gap-1.5 space-y-0 px-0 pr-11 text-left">
            <SheetTitle className="text-lg font-bold leading-snug tracking-tight">
              {selectedItem?.name}
            </SheetTitle>
            {selectedItem && (
              <p className="text-sm font-semibold tabular-nums text-primary">
                {calculatePriceRange(selectedItem)}
              </p>
            )}
            <SheetDescription className="text-left text-sm leading-relaxed text-muted-foreground">
              Pick an option (e.g. drink or size). Add allergy or kitchen notes below if needed.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pb-3 pt-1">
            {selectedItem?.image_url && (
              <div className="relative aspect-[21/9] w-full overflow-hidden rounded-lg bg-muted sm:aspect-[2/1]">
                <MenuItemPhoto
                  src={selectedItem.image_url}
                  alt={selectedItem.name}
                  sizes="320px"
                  className={
                    isSupabasePublicMenuImage(selectedItem.image_url)
                      ? undefined
                      : 'absolute inset-0 h-full w-full object-cover'
                  }
                />
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Choose one
              </p>
              <div className="space-y-2">
                {selectedItem?.modifiers?.map((mod: any) => {
                  const isSelected = selectedModifierId === mod.id
                  const modQty = selectedItem ? getCartQuantityForModifier(selectedItem.id, mod.id) : 0

                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => setSelectedModifierId(mod.id)}
                      className={cn(
                        'w-full touch-manipulation rounded-xl border-2 px-3 py-2.5 text-left ring-offset-background sm:px-3.5 sm:py-3',
                        'motion-safe:transition-[border-color,background-color,box-shadow,transform,ring]',
                        'motion-safe:duration-150 motion-safe:ease-out motion-safe:active:scale-[0.995]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/25'
                          : 'border-border hover:border-primary/35 hover:bg-muted/40',
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors sm:h-5 sm:w-5 ${
                              isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/35'
                            }`}
                          >
                            {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground sm:h-3 sm:w-3" />}
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-semibold leading-snug sm:text-[15px]">{mod.name}</span>
                            {modQty > 0 && (
                              <span className="ml-2 text-xs font-semibold text-primary sm:text-sm">{modQty} in cart</span>
                            )}
                          </div>
                        </div>
                        <span className="shrink-0 text-sm font-bold tabular-nums sm:text-[15px]">
                          {formatCurrency(selectedItem.price + mod.price_modifier)}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modifier-sheet-notes" className="text-sm font-medium text-foreground">
                Allergies &amp; special requests{' '}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="modifier-sheet-notes"
                value={modifierSheetNotes}
                onChange={e => setModifierSheetNotes(e.target.value)}
                placeholder="e.g. peanut allergy — no nuts; well done; extra sauce on the side"
                className="min-h-[72px] resize-none text-base leading-relaxed placeholder:text-muted-foreground/65 sm:min-h-20 sm:text-[15px]"
              />
            </div>
          </div>

          <div className="shrink-0 border-t bg-background pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-3">
            <div className="flex gap-2.5 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => setIsModifierSheetOpen(false)}
                className="h-11 flex-1 rounded-xl text-base font-semibold sm:h-12"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmModifier}
                disabled={!selectedModifierId}
                className="h-11 flex-1 touch-manipulation rounded-xl text-base font-semibold motion-safe:transition-transform motion-safe:active:scale-[0.98] disabled:opacity-60 sm:h-12"
              >
                <ShoppingBag className="mr-2 h-4 w-4 shrink-0" />
                Add to cart
                {selectedModifierId ? ` · ${getModifierPriceDisplay(selectedItem, selectedModifierId)}` : ''}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
