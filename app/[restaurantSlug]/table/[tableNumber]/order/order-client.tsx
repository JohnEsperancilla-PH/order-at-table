'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShoppingCart, Minus, CheckCircle2, Plus, ShoppingBag, Trash2, Tag, Loader2, Copy, Check, XCircle } from 'lucide-react'
import { createOrder, getOrderById, getActiveOrderForSession } from '@/lib/actions/orders'
import { CartItem, MenuItem, MenuCategory, Order, OrderStatus } from '@/lib/types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatCurrency, cn } from '@/lib/utils'
import { MenuAccordion } from './menu-accordion'

interface OrderPageClientProps {
  table: any
  categories: MenuCategory[]
  menuItems: any[]
  activeOrder?: Order | null
  restaurantSlug: string
}

function CartToastBubble({ message }: { message: string }) {
  const removed = message.endsWith('removed from cart')
  const Icon = removed ? Trash2 : CheckCircle2
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-xl bg-foreground px-4 py-3 text-background shadow-xl ring-1 ring-black/10 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-200 md:px-5 md:py-3.5 dark:bg-neutral-950 dark:ring-white/10"
    >
      <Icon className="h-5 w-5 shrink-0 opacity-90 md:h-6 md:w-6" aria-hidden />
      <span className="min-w-0 flex-1 text-sm font-medium leading-snug md:text-base">{message}</span>
    </div>
  )
}

/** Minimal cart rows stored alongside guest session in localStorage */
interface PersistedGuestCartLine {
  lineId: string
  menu_item_id: string
  quantity: number
  modifier_id: string | null
  special_instructions?: string | null
}

function serializeGuestCart(cart: CartItem[]): PersistedGuestCartLine[] {
  return cart.map(ci => ({
    lineId: ci.lineId,
    menu_item_id: ci.menu_item.id,
    quantity: ci.quantity,
    modifier_id: ci.modifier_id ?? null,
    special_instructions: ci.special_instructions ?? null,
  }))
}

function hydrateGuestCart(lines: unknown, menuItems: MenuItem[]): CartItem[] {
  if (!Array.isArray(lines)) return []
  const byId = new Map(menuItems.map(m => [m.id, m]))
  const out: CartItem[] = []
  for (const raw of lines) {
    if (!raw || typeof raw !== 'object') continue
    const line = raw as Partial<PersistedGuestCartLine>
    if (!line.menu_item_id || typeof line.quantity !== 'number') continue
    const menu_item = byId.get(line.menu_item_id)
    if (!menu_item) continue
    const modifier_id = line.modifier_id ?? null
    const modifier =
      modifier_id && menu_item.modifiers?.length
        ? menu_item.modifiers.find((m: { id: string }) => m.id === modifier_id)
        : undefined
    const lineId =
      line.lineId && typeof line.lineId === 'string'
        ? line.lineId
        : typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `line_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    out.push({
      lineId,
      menu_item,
      quantity: Math.max(1, Math.floor(Number(line.quantity))),
      modifier_id,
      modifier: modifier ?? undefined,
      special_instructions: line.special_instructions?.trim() || undefined,
    })
  }
  return out
}

export function OrderPageClient({
  table,
  categories,
  menuItems,
  activeOrder,
  restaurantSlug,
}: OrderPageClientProps) {
  const router = useRouter()
  const restaurant = table?.restaurants

  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState<string | null>(null)
  const [customerSessionId, setCustomerSessionId] = useState<string | null>(null)
  const [discountCode, setDiscountCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingSubmissionKey, setPendingSubmissionKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [orderPlaced, setOrderPlaced] = useState<Order | null>(activeOrder ?? null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [addedMessage, setAddedMessage] = useState<string | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [guestCartReady, setGuestCartReady] = useState(false)

  const SESSION_TTL_MS = 30 * 60 * 1000 // 30 minutes

  // Auto-refresh order status if there's an active order
  useEffect(() => {
    if (!orderPlaced) return

    const interval = setInterval(async () => {
      try {
        setIsRefreshing(true)
        const updatedOrder = await getOrderById(orderPlaced.id)
        if (updatedOrder) {
          setOrderPlaced(updatedOrder)
        }
      } catch (error) {
        console.error('Failed to refresh order status:', error)
      } finally {
        setIsRefreshing(false)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [orderPlaced?.id])

  // Load or resume session — uses expiration instead of beforeunload wipe
  useEffect(() => {
    if (!table?.id) return
    try {
      const key = `order_session_${table.id}`
      const stored = typeof window !== 'undefined' ? localStorage.getItem(key) : null
      if (!stored) {
        router.replace(`/${restaurantSlug}/table/${table.table_number}`)
        return
      }
      const parsed = JSON.parse(stored)
      if (!parsed?.id || !parsed?.name) {
        router.replace(`/${restaurantSlug}/table/${table.table_number}`)
        return
      }

      // Check expiration
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        localStorage.removeItem(key)
        router.replace(`/${restaurantSlug}/table/${table.table_number}`)
        return
      }

      setCustomerSessionId(parsed.id)
      if (parsed.name) setCustomerName(parsed.name)

      // Bump expiration
      parsed.expiresAt = Date.now() + SESSION_TTL_MS
      localStorage.setItem(key, JSON.stringify(parsed))

      ;(async () => {
        try {
          const sessionOrder = await getActiveOrderForSession(table.id, parsed.id)
          if (sessionOrder) setOrderPlaced(sessionOrder)
        } catch (err) {
          console.error('Failed to load session order:', err)
        }
      })()
    } catch (err) {
      router.replace(`/${restaurantSlug}/table/${table.table_number}`)
    }
  }, [table?.id, router, restaurantSlug, table?.table_number])

  /** Reset draft-cart gate when guest identity changes */
  useEffect(() => {
    setGuestCartReady(false)
  }, [table?.id, customerSessionId])

  /** Restore cart + optional discount from localStorage once menu data exists */
  useEffect(() => {
    if (guestCartReady) return
    if (!table?.id || !customerSessionId || menuItems.length === 0) return

    try {
      const raw = localStorage.getItem(`order_session_${table.id}`)
      if (raw) {
        const parsed = JSON.parse(raw)
        const hydrated = hydrateGuestCart(parsed?.cartLines, menuItems as MenuItem[])
        if (hydrated.length > 0) setCart(hydrated)
        if (typeof parsed.discountCode === 'string') setDiscountCode(parsed.discountCode)
      }
    } catch (e) {
      console.error('Failed to restore guest cart:', e)
    }
    setGuestCartReady(true)
  }, [guestCartReady, table?.id, customerSessionId, menuItems])

  /** Persist draft cart alongside session blob */
  useEffect(() => {
    if (!guestCartReady || !table?.id || !customerSessionId) return

    try {
      const storageKey = `order_session_${table.id}`
      const raw = localStorage.getItem(storageKey)
      if (!raw) return
      const parsed = JSON.parse(raw)
      parsed.cartLines = serializeGuestCart(cart)
      parsed.discountCode = discountCode
      parsed.expiresAt = Date.now() + SESSION_TTL_MS
      localStorage.setItem(storageKey, JSON.stringify(parsed))
    } catch (e) {
      console.error('Failed to persist guest cart:', e)
    }
  }, [cart, discountCode, guestCartReady, customerSessionId, table?.id])

  const filteredItems = useMemo(() => menuItems, [menuItems])

  useEffect(() => {
    if (!addedMessage) return
    const timeout = setTimeout(() => setAddedMessage(null), 2000)
    return () => clearTimeout(timeout)
  }, [addedMessage])

  const normalizeInstructions = (s?: string | null) => (s || '').trim()

  const lineUnitPrice = (line: CartItem) => {
    const mod = line.modifier
    return mod ? line.menu_item.price + mod.price_modifier : line.menu_item.price
  }

  const addToCart = (
    item: MenuItem,
    modifierId?: string | null,
    specialInstructions?: string | null
  ) => {
    const mod =
      modifierId != null && modifierId !== ''
        ? item.modifiers?.find((m: { id: string }) => m.id === modifierId) ?? null
        : null
    const ni = normalizeInstructions(specialInstructions)

    setCart(prev => {
      const existingIndex = prev.findIndex(
        ci =>
          ci.menu_item.id === item.id &&
          (ci.modifier_id || null) === (modifierId || null) &&
          normalizeInstructions(ci.special_instructions) === ni
      )

      if (existingIndex >= 0) {
        const newCart = [...prev]
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newCart[existingIndex].quantity + 1,
        }
        return newCart
      }

      const lineId =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `line_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

      return [
        ...prev,
        {
          lineId,
          menu_item: item,
          quantity: 1,
          modifier_id: modifierId || null,
          modifier: mod ?? undefined,
          special_instructions: ni || undefined,
        },
      ]
    })

    const modText = mod ? ` (${mod.name})` : ''
    setAddedMessage(`${item.name}${modText} added to cart`)

    // Haptic feedback on mobile
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15)
    }
  }

  const removeFromCart = (lineId: string) => {
    let toast: string | null = null
    setCart(prev => {
      const line = prev.find(ci => ci.lineId === lineId)
      if (line) {
        const modText = line.modifier ? ` (${line.modifier.name})` : ''
        toast = `${line.menu_item.name}${modText} removed from cart`
      }
      return prev.filter(ci => ci.lineId !== lineId)
    })
    if (toast) setAddedMessage(toast)
  }

  const updateQuantity = (lineId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(lineId)
      return
    }
    setCart(prev => prev.map(ci => (ci.lineId === lineId ? { ...ci, quantity } : ci)))
  }

  const setLineSpecialInstructions = (lineId: string, text: string) => {
    setCart(prev =>
      prev.map(ci =>
        ci.lineId === lineId ? { ...ci, special_instructions: text || undefined } : ci
      )
    )
  }

  const subtotal = cart.reduce((sum, item) => sum + lineUnitPrice(item) * item.quantity, 0)

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      setError('Your cart is empty')
      return
    }

    setIsSubmitting(true)
    setError(null)
    const submissionKey = pendingSubmissionKey || crypto.randomUUID()
    if (!pendingSubmissionKey) {
      setPendingSubmissionKey(submissionKey)
    }

    try {
      if (!customerName || !customerName.trim()) {
        setError('Please enter your name before placing the order')
        setIsSubmitting(false)
        return
      }

      let sessionId = customerSessionId
      if (!sessionId) {
        sessionId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
          ? (crypto as any).randomUUID()
          : `sess_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
        setCustomerSessionId(sessionId)
        try {
          const key = `order_session_${table.id}`
          localStorage.setItem(key, JSON.stringify({
            id: sessionId,
            name: customerName,
            expiresAt: Date.now() + SESSION_TTL_MS,
          }))
        } catch (e) {
          // ignore localStorage errors
        }
      }

      const orderItems = cart.map(item => ({
        menu_item_id: item.menu_item.id,
        quantity: item.quantity,
        price: lineUnitPrice(item),
        modifier_id: item.modifier_id || undefined,
        special_instructions: item.special_instructions?.trim() || undefined,
      }))

      const order = await createOrder(
        table.id,
        table.restaurant_id,
        orderItems,
        discountCode.trim() || undefined,
        sessionId ?? undefined,
        customerName ?? undefined,
        submissionKey
      )

      setOrderPlaced(order)
      setCart([])
      setDiscountCode('')
      setPendingSubmissionKey(null)
      setIsCartOpen(false)
      router.replace(`/${restaurantSlug}/table/${table.table_number}/orders/${order.id}/${order.status}`)
    } catch (err: any) {
      setError(err.message || 'Failed to place order')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (orderPlaced) {
    return (
      <OrderConfirmationView
        order={orderPlaced}
        isRefreshing={isRefreshing}
        restaurantName={restaurant?.name}
        tableNumber={table.table_number}
        coverImageUrl={restaurant?.cover_image_url}
        restaurantSlug={restaurantSlug}
        onStartNewOrder={() => setOrderPlaced(null)}
        onClose={() => {
          router.replace(`/${restaurantSlug}/table/${table.table_number}`)
        }}
        onManualRefresh={async () => {
          setIsRefreshing(true)
          try {
            const updated = await getOrderById(orderPlaced.id, String(table.table_number))
            if (updated) setOrderPlaced(updated)
          } catch (err) {
            console.error('Failed to refresh order:', err)
          } finally {
            setIsRefreshing(false)
          }
        }}
      />
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/20 max-md:pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:min-h-[100dvh] md:pb-8">
      <div
        className={cn(
          'relative mx-auto flex w-full max-w-md flex-1 flex-col space-y-4 p-4 sm:p-5 md:min-h-0',
          // Tablet / desktop: wide canvas + clip so only the menu column scrolls (cart bar fixed below)
          'md:max-w-4xl md:flex-1 md:overflow-hidden md:rounded-none md:border-0 md:bg-transparent md:p-6 md:shadow-none',
        )}
      >
        <div className="space-y-1">
          <div className="flex w-full shrink-0 items-center justify-center px-1 py-0.5 leading-tight">
            <Link
              href="/public-beta"
              className="text-center text-[11px] font-medium leading-snug text-muted-foreground underline decoration-muted-foreground/40 underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground/60 md:text-xs"
            >
              Learn More about QRder - Public Beta 1.1
            </Link>
          </div>

          {/* Hero — taller ratio for prominence */}
          <div className="relative overflow-hidden rounded-2xl ring-1 ring-black/5 dark:ring-white/10">
            <div
              className="h-[clamp(110px,22dvh,180px)] w-full bg-gradient-to-br from-brand/20 to-brand/5"
              style={restaurant?.cover_image_url ? {
                backgroundImage: `url(${restaurant.cover_image_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : undefined}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-5 text-white">
              <h1 className="text-xl font-bold tracking-tight drop-shadow-md sm:text-2xl md:text-3xl">
                {restaurant?.name || 'Sample Restaurant'}
              </h1>
              <p className="mt-1 text-sm text-white/80 md:text-base">
                Table {table.table_number}
              </p>
            </div>
          </div>
        </div>

        {customerName && (
          <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 text-center">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground md:text-xs">
              Ordering as
            </p>
            <p className="text-base font-semibold tracking-tight text-foreground md:text-lg">{customerName}</p>
          </div>
        )}

        {/* Scrollable menu — pad bottom on tablets/laptops for viewport-fixed cart bar */}
        <div className="guest-overscroll-contain flex min-h-0 flex-1 flex-col space-y-4 md:overflow-y-auto md:pb-[5.75rem] md:pr-1">
          <MenuAccordion
            categories={categories}
            menuItems={filteredItems}
            cart={cart}
            onAddToCart={addToCart}
            onUpdateQuantity={updateQuantity}
          />
        </div>

      </div>

      {/* Tablet / desktop: pinned cart bar — does not shift when accordions expand */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 hidden border-t border-border/60 bg-background/95 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur-sm md:block">
        <div className="pointer-events-auto mx-auto w-full max-w-4xl px-6">
          <Button
            className="h-12 w-full rounded-xl text-base shadow-lg touch-manipulation motion-safe:transition-transform motion-safe:active:scale-[0.99] md:h-14 md:text-lg"
            size="lg"
            onClick={() => setIsCartOpen(true)}
            disabled={cartItemCount === 0}
          >
            <ShoppingCart className="mr-2 h-5 w-5 md:h-6 md:w-6" />
            {cartItemCount > 0 ? (
              <span className="flex items-center gap-2">
                View Cart ({cartItemCount})
                <span className="text-primary-foreground/70">&middot;</span>
                <span>{formatCurrency(subtotal)}</span>
              </span>
            ) : (
              'Cart is empty'
            )}
          </Button>
        </div>
      </div>

      {/* Cart toast above tablet/laptop fixed bar */}
      {addedMessage != null && !isCartOpen ? (
        <div className="pointer-events-none fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] left-1/2 z-50 hidden w-[calc(100%-3rem)] max-w-4xl -translate-x-1/2 md:block">
          <div className="pointer-events-auto flex justify-center px-6">
            <div className="w-full max-w-md">
              <CartToastBubble message={addedMessage} />
            </div>
          </div>
        </div>
      ) : null}

      {/* Mobile fixed cart bar — toast floats above bar so layout height stays stable */}
      <div className="pointer-events-none fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-2 md:hidden">
        <div className="relative pointer-events-auto">
          {addedMessage != null && !isCartOpen ? (
            <div className="pointer-events-none absolute bottom-full left-0 right-0 z-50 mb-2">
              <div className="pointer-events-auto">
                <CartToastBubble message={addedMessage} />
              </div>
            </div>
          ) : null}
          <Button
            className="h-12 w-full touch-manipulation rounded-xl text-base shadow-lg motion-safe:transition-transform motion-safe:active:scale-[0.99]"
            size="lg"
            onClick={() => setIsCartOpen(true)}
            disabled={cartItemCount === 0}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            {cartItemCount > 0 ? (
              <span className="flex items-center gap-2">
                View Cart ({cartItemCount})
                <span className="text-primary-foreground/70">&middot;</span>
                <span>{formatCurrency(subtotal)}</span>
              </span>
            ) : (
              'Cart is empty'
            )}
          </Button>
        </div>
      </div>

      {/* Cart Sheet — single-step checkout with discount inline */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent
          side="bottom"
          className={cn(
            // Mobile-first bottom sheet — never use position:relative here; it overrides Radix fixed and hides the panel off-layout.
            'flex min-h-0 w-full flex-col gap-0 overflow-hidden rounded-t-2xl border-x border-t border-border bg-background p-0 pb-0 pt-2 shadow-2xl',
            'max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-bottom,0px)-env(safe-area-inset-top,0px)-12px))]',
            // ≥640px: centered card above bottom safe area (still bottom-sheet interaction model)
            'sm:inset-x-auto sm:left-1/2 sm:right-auto sm:w-[min(28rem,calc(100vw-1rem))] sm:max-w-md sm:-translate-x-1/2',
            // md+: wider checkout panel on tablets / desktops
            'md:max-w-2xl md:w-[min(42rem,calc(100vw-2rem))]',
            // ≥768px: slight lift so it clears rounded desktop chrome / browser UI
            'md:bottom-6 md:max-h-[min(88dvh,34rem)] md:rounded-2xl md:border md:shadow-2xl',
          )}
        >
          <SheetHeader className="shrink-0 gap-1.5 border-b border-border/50 px-4 pb-3 pr-14 pt-2 text-left md:px-5">
            <SheetTitle className="flex items-center gap-2 text-lg font-bold tracking-tight md:text-xl">
              <span>Your Cart</span>
              <Badge variant="secondary" className="h-6 min-w-6 px-1.5 text-xs font-semibold tabular-nums md:h-7 md:min-w-7 md:px-2 md:text-sm">
                {cartItemCount}
              </Badge>
            </SheetTitle>
            <SheetDescription className="text-sm leading-snug text-foreground/70 md:text-base">
              Review your items and place your order.
            </SheetDescription>
            <button
              type="button"
              className="mt-1 w-fit text-left text-sm font-semibold text-brand underline-offset-4 hover:underline md:text-base"
              onClick={() => setIsCartOpen(false)}
            >
              Continue browsing menu
            </button>
          </SheetHeader>

          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 sm:px-5">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground md:text-base">Your cart is empty</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="shrink-0 px-4 pt-2 sm:px-5">
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-xs md:text-sm">{error}</AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="guest-overscroll-contain min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-contain px-4 py-3 sm:px-5">
                <div className="space-y-2">
                  {cart.map(item => {
                    const itemPrice = lineUnitPrice(item)
                    const lineTotal = itemPrice * item.quantity

                    return (
                      <div key={item.lineId} className="space-y-2.5 rounded-xl border border-border/60 p-3.5">
                        <div className="flex items-start gap-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold leading-snug md:text-base">{item.menu_item.name}</p>
                            {item.modifier && (
                              <p className="mt-0.5 text-sm font-medium text-primary md:text-base">{item.modifier.name}</p>
                            )}
                            <p className="mt-1 text-xs leading-snug text-foreground/80 sm:text-[13px] md:text-sm">
                              <span className="tabular-nums text-muted-foreground">
                                {formatCurrency(itemPrice)} × {item.quantity}
                              </span>
                              <span className="mx-1.5 text-muted-foreground">=</span>
                              <span className="font-semibold tabular-nums text-foreground">
                                {formatCurrency(lineTotal)}
                              </span>
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-10 w-10 touch-manipulation rounded-full sm:h-9 sm:w-9"
                              aria-label={`Decrease quantity for ${item.menu_item.name}`}
                              onClick={() => updateQuantity(item.lineId, item.quantity - 1)}
                            >
                              <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                            <span className="min-w-[1.5rem] text-center text-sm font-bold tabular-nums md:text-base">
                              {item.quantity}
                            </span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-10 w-10 touch-manipulation rounded-full sm:h-9 sm:w-9"
                              aria-label={`Increase quantity for ${item.menu_item.name}`}
                              onClick={() => updateQuantity(item.lineId, item.quantity + 1)}
                            >
                              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-10 w-10 touch-manipulation text-muted-foreground hover:text-destructive sm:h-9 sm:w-9"
                              aria-label={`Remove ${item.menu_item.name} from cart`}
                              onClick={() => removeFromCart(item.lineId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-foreground/90 sm:text-sm md:text-base">
                            Allergies &amp; special requests
                          </Label>
                          <Textarea
                            value={item.special_instructions ?? ''}
                            onChange={e => setLineSpecialInstructions(item.lineId, e.target.value)}
                            placeholder="Optional — e.g. nut allergy, no dairy, cooking preference"
                            className="mt-1.5 min-h-[68px] resize-none text-sm leading-normal placeholder:text-muted-foreground/70 md:text-base"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Footer — discount + total + place order (toast overlays; does not reserve height) */}
              <div className="relative shrink-0 border-t border-border/60 bg-background px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-3 sm:px-5">
                {addedMessage != null && isCartOpen ? (
                  <div className="pointer-events-none absolute bottom-full left-0 right-0 z-50 mb-2 flex justify-center px-4 sm:px-5">
                    <div className="pointer-events-auto w-full max-w-md">
                      <CartToastBubble message={addedMessage} />
                    </div>
                  </div>
                ) : null}

                <div className="space-y-3">
                {/* Discount code inline */}
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={discountCode}
                    onChange={e => {
                      setDiscountCode(e.target.value.toUpperCase())
                      if (error) setError(null)
                    }}
                    autoCapitalize="characters"
                    autoComplete="off"
                    placeholder="Discount code (optional)"
                    className="h-10 pl-9 text-sm md:h-11 md:text-base"
                  />
                </div>

                <Separator className="bg-border/70" />
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm text-foreground/80 md:text-base">
                    <span>
                      {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                    </span>
                    <span className="tabular-nums font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold md:text-xl">
                    <span>Total</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                </div>
                <Button
                  className="h-11 w-full touch-manipulation rounded-xl text-sm font-semibold motion-safe:transition-transform motion-safe:active:scale-[0.99] sm:h-12 sm:text-base md:h-[3.25rem] md:text-lg"
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={cart.length === 0 || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Placing order…
                    </>
                  ) : (
                    `Place order · ${formatCurrency(subtotal)}`
                  )}
                </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function orderProgressIndex(status: OrderStatus): number {
  switch (status) {
    case 'pending':
    case 'awaiting_cashier_confirmation':
      return 0
    case 'confirmed':
      return 1
    case 'ready_for_pickup':
      return 2
    case 'completed':
      return 3
    case 'cancelled':
      return -1
    default:
      return 0
  }
}

const PROGRESS_LABELS = ['Sent', 'Confirmed', 'Ready', 'Done'] as const

export function OrderConfirmationView({
  order,
  isRefreshing: _isRefreshing,
  onManualRefresh: _onManualRefresh,
  onStartNewOrder,
  onClose,
  restaurantName: _restaurantName,
  restaurantSlug,
  tableNumber,
  coverImageUrl: _coverImageUrl,
}: {
  order: Order
  isRefreshing: boolean
  onManualRefresh?: () => void | Promise<void>
  onStartNewOrder?: () => void
  onClose?: () => void
  restaurantName?: string
  restaurantSlug?: string
  tableNumber?: string
  coverImageUrl?: string
}) {
  const [copied, setCopied] = useState(false)

  const isCompleted = order.status === 'completed'
  const isReady = order.status === 'ready_for_pickup'
  const isConfirmed = order.status === 'confirmed'
  const isCancelled = order.status === 'cancelled'
  const isAwaitingPay = order.status === 'awaiting_cashier_confirmation'
  const isPending = order.status === 'pending'

  const displayTable = String(tableNumber || (order as any)?.tables?.table_number || '—')

  const progressIdx = orderProgressIndex(order.status as OrderStatus)

  const headline = (() => {
    if (isCancelled) return 'Order cancelled'
    if (isCompleted) return 'Thank you!'
    if (isReady) return 'Your order is ready'
    if (isConfirmed) return 'Being prepared'
    if (isAwaitingPay) return 'Pay at the cashier'
    if (isPending) return 'Order received'
    return 'Order update'
  })()

  const subline = (() => {
    if (isCancelled) {
      return 'This order is no longer active. Please speak with staff if you need help.'
    }
    if (isCompleted) {
      return 'We hope you enjoy your meal.'
    }
    if (isReady) {
      return 'We are bringing it to your table now.'
    }
    if (isConfirmed) {
      return 'Kitchen is working on your order. We will notify you when it is ready.'
    }
    if (isAwaitingPay) {
      return 'Show your confirmation code at the counter to pay and send your order to the kitchen.'
    }
    if (isPending) {
      return 'Your order is in the queue. Status will update automatically.'
    }
    return 'Keep this page open for live updates.'
  })()

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(order.confirmation_code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(12)
      }
    } catch {
      // Clipboard may be denied
    }
  }, [order.confirmation_code])

  const menuHref =
    restaurantSlug && displayTable !== '—'
      ? `/${restaurantSlug}/table/${displayTable}/order`
      : null

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-muted/30 via-background to-background pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] md:flex md:items-center md:justify-center md:py-12 md:px-6">
      <div className="mx-auto w-full max-w-md px-4 pt-8 md:max-w-lg md:px-6 md:pt-0">
        <Card className="overflow-hidden border-border/50 shadow-lg md:rounded-2xl">
          <CardContent className="space-y-7 px-6 pb-8 pt-10 text-center sm:px-8">
            <div
              className={cn(
                'mx-auto flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-full',
                isCancelled ? 'bg-destructive/10' : 'bg-success/15',
              )}
            >
              {isCancelled ? (
                <XCircle className="h-8 w-8 text-destructive" aria-hidden />
              ) : (
                <CheckCircle2 className="h-8 w-8 text-success" aria-hidden />
              )}
            </div>

            <div className="space-y-3">
              <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground">{headline}</h2>
              <p className="text-pretty text-[15px] leading-relaxed text-muted-foreground">{subline}</p>
            </div>

            {!isCancelled && (
              <div className="rounded-xl border border-border/60 bg-muted/25 px-5 py-5 text-center">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Confirmation code
                </p>
                <p className="font-mono text-[1.75rem] font-bold leading-none tracking-[0.14em] text-foreground sm:text-[2rem]">
                  {order.confirmation_code}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-4 h-10 w-full rounded-lg text-sm font-semibold sm:inline-flex sm:w-auto"
                  onClick={() => void handleCopyCode()}
                >
                  {copied ? (
                    <>
                      <Check className="mr-1.5 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 h-4 w-4" />
                      Copy code
                    </>
                  )}
                </Button>
              </div>
            )}

            <div className="flex items-center justify-center gap-4 border-y border-border/45 py-5 text-base tabular-nums">
              <span className="text-muted-foreground">Total</span>
              <span className="text-xl font-bold text-foreground">{formatCurrency(order.total_amount)}</span>
            </div>

            {!isCancelled && progressIdx >= 0 && (
              <div className="rounded-xl border border-border/50 bg-muted/15 px-4 py-5">
                <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Progress
                </p>
                <div className="flex gap-2">
                  {PROGRESS_LABELS.map((label, i) => {
                    const stepComplete = isCompleted || i < progressIdx
                    const stepCurrent = !isCompleted && i === progressIdx
                    return (
                      <div key={label} className="flex flex-1 flex-col items-center gap-2">
                        <div
                          className={cn(
                            'flex h-9 w-full max-w-[3.5rem] items-center justify-center rounded-full text-xs font-bold transition-colors',
                            stepComplete && 'bg-primary text-primary-foreground',
                            stepCurrent && !stepComplete && 'bg-primary/15 text-primary ring-2 ring-primary/25',
                            !stepComplete && !stepCurrent && 'bg-muted text-muted-foreground',
                          )}
                          aria-current={stepCurrent ? 'step' : undefined}
                        >
                          {stepComplete ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
                        </div>
                        <span className="max-w-[5rem] text-center text-[10px] font-medium leading-tight text-muted-foreground sm:text-[11px]">
                          {label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {!isCompleted && !isCancelled && menuHref && (
              <Button variant="outline" className="h-11 w-full rounded-xl text-sm font-semibold" asChild>
                <Link href={menuHref}>Back to menu</Link>
              </Button>
            )}

            {isCompleted && (
              <div className="flex flex-col gap-3 pt-1">
                {onStartNewOrder ? (
                  <Button variant="outline" className="h-11 rounded-xl text-base font-semibold" onClick={onStartNewOrder}>
                    Order something else
                  </Button>
                ) : menuHref ? (
                  <Button variant="outline" className="h-11 rounded-xl text-base font-semibold" asChild>
                    <Link href={menuHref}>Order something else</Link>
                  </Button>
                ) : null}
                {onClose && (
                  <Button className="h-11 rounded-xl text-base font-semibold" onClick={onClose}>
                    Done
                  </Button>
                )}
              </div>
            )}

            {isCancelled && onClose && (
              <Button className="h-11 w-full rounded-xl text-base font-semibold" variant="outline" onClick={onClose}>
                Back to table
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
