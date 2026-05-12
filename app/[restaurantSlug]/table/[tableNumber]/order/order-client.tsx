'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShoppingCart, Minus, CheckCircle2, X, RefreshCw, Plus, ShoppingBag, Trash2, Tag } from 'lucide-react'
import { createOrder, getOrderById, getActiveOrderForSession } from '@/lib/actions/orders'
import { CartItem, MenuItem, MenuCategory, Order } from '@/lib/types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useIsMobile } from '@/hooks/use-mobile'
import { formatCurrency } from '@/lib/utils'
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
      className="flex items-center gap-3 rounded-xl bg-foreground px-4 py-3 text-background shadow-xl motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-200 dark:bg-neutral-950"
    >
      <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
      <span className="text-sm font-medium">{message}</span>
    </div>
  )
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
  const isMobile = useIsMobile()

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
  }, [table?.id, router, table?.table_number])

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
    const trimmed = text.trim()
    setCart(prev =>
      prev.map(ci =>
        ci.lineId === lineId ? { ...ci, special_instructions: trimmed || undefined } : ci
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
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:flex md:items-center md:justify-center md:px-6 md:py-8 md:pb-8">
      <div className="mx-auto max-w-md space-y-4 p-4 sm:p-5 md:h-[840px] md:w-[28rem] md:max-h-[calc(100dvh-4rem)] md:overflow-hidden md:rounded-[28px] md:border md:bg-background md:shadow-2xl md:flex md:flex-col">
        <div className="space-y-1">
          <div className="flex w-full shrink-0 items-center justify-center px-1 py-0.5 leading-tight">
            <Link
              href="/public-beta"
              className="text-center text-[11px] font-medium leading-snug text-muted-foreground underline decoration-muted-foreground/40 underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground/60"
            >
              Learn More about QRder - Public Beta 1.0
            </Link>
          </div>

          {/* Hero — taller ratio for prominence */}
          <div className="relative overflow-hidden rounded-2xl ring-1 ring-black/5 dark:ring-white/10">
            <div
              className="h-[clamp(110px,22dvh,180px)] w-full bg-gradient-to-br from-primary/20 to-primary/5"
              style={restaurant?.cover_image_url ? {
                backgroundImage: `url(${restaurant.cover_image_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : undefined}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-5 text-white">
              <h1 className="text-xl font-bold tracking-tight drop-shadow-md sm:text-2xl">
                {restaurant?.name || 'Sample Restaurant'}
              </h1>
              <p className="text-white/80 text-sm mt-1">
                Table {table.table_number}
              </p>
            </div>
          </div>
        </div>

        {customerName && (
          <div className="py-1 text-center">
            <p className="text-lg font-semibold tracking-tight text-foreground">
              Welcome, {customerName}!
            </p>
          </div>
        )}

        {/* Scrollable menu */}
        <div className="guest-overscroll-contain space-y-4 md:flex-1 md:min-h-0 md:overflow-y-auto md:pr-1">
          <MenuAccordion
            categories={categories}
            menuItems={filteredItems}
            cart={cart}
            onAddToCart={addToCart}
            onUpdateQuantity={updateQuantity}
          />
        </div>

        {/* Desktop cart toast */}
        {addedMessage != null && !isCartOpen ? (
          <div className="hidden shrink-0 md:block">
            <CartToastBubble message={addedMessage} />
          </div>
        ) : null}

        {/* Desktop View Cart button */}
        <div className="hidden border-t border-border/60 pt-3 md:block">
          <Button
            className="h-12 w-full rounded-xl text-base shadow-lg touch-manipulation motion-safe:transition-transform motion-safe:active:scale-[0.99]"
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

      {/* Mobile fixed cart bar */}
      <div className="pointer-events-none fixed bottom-0 left-1/2 z-40 flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-2 md:hidden">
        {addedMessage != null && !isCartOpen ? (
          <div className="pointer-events-auto">
            <CartToastBubble message={addedMessage} />
          </div>
        ) : null}
        <div className="pointer-events-auto border-t border-border/70 bg-background/90 pt-2.5 backdrop-blur-lg rounded-t-xl">
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
          className="flex max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-bottom,0px)))] min-h-0 flex-col gap-0 overflow-hidden rounded-t-2xl p-0 pb-0 pt-2 max-w-md md:bottom-[calc(50%-420px+0.75rem)] md:left-1/2 md:max-h-[min(600px,calc(100dvh-3rem))] md:w-[calc(28rem-1.5rem)] md:max-w-[calc(28rem-1.5rem)] md:-translate-x-1/2 md:rounded-2xl md:border md:p-0 md:shadow-2xl md:pt-2"
        >
          <SheetHeader className="shrink-0 gap-1.5 border-b border-border/50 px-4 pb-3 pr-14 pt-2 text-left md:px-5">
            <SheetTitle className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <span>Your Cart</span>
              <Badge variant="secondary" className="h-6 min-w-6 px-1.5 text-xs font-semibold tabular-nums">
                {cartItemCount}
              </Badge>
            </SheetTitle>
            <SheetDescription className="text-sm leading-snug text-foreground/70">
              Review your items and place your order.
            </SheetDescription>
          </SheetHeader>

          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 sm:px-5">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">Your cart is empty</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="shrink-0 px-4 pt-2 sm:px-5">
                  <Alert variant="destructive" className="py-2">
                    <AlertDescription className="text-xs">{error}</AlertDescription>
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
                            <p className="text-sm font-semibold leading-snug">{item.menu_item.name}</p>
                            {item.modifier && (
                              <p className="mt-0.5 text-sm font-medium text-primary">{item.modifier.name}</p>
                            )}
                            <p className="mt-1 text-xs leading-snug text-foreground/80 sm:text-[13px]">
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
                            <span className="min-w-[1.5rem] text-center text-sm font-bold tabular-nums">
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
                          <Label className="text-xs font-medium text-foreground/90 sm:text-sm">
                            Allergies &amp; special requests
                          </Label>
                          <Textarea
                            value={item.special_instructions ?? ''}
                            onChange={e => setLineSpecialInstructions(item.lineId, e.target.value)}
                            placeholder="Optional — e.g. nut allergy, no dairy, cooking preference"
                            className="mt-1.5 min-h-[68px] resize-none text-sm leading-normal placeholder:text-muted-foreground/70"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Footer — discount + total + place order */}
              <div className="shrink-0 space-y-3 border-t border-border/60 bg-background px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-3 sm:px-5">
                {addedMessage != null && isCartOpen ? (
                  <CartToastBubble message={addedMessage} />
                ) : null}

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
                    className="h-10 pl-9 text-sm"
                  />
                </div>

                <Separator className="bg-border/70" />
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm text-foreground/80">
                    <span>
                      {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                    </span>
                    <span className="tabular-nums font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                </div>
                <Button
                  className="h-11 w-full touch-manipulation rounded-xl text-sm font-semibold motion-safe:transition-transform motion-safe:active:scale-[0.99] sm:h-12 sm:text-base"
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={cart.length === 0 || isSubmitting}
                >
                  {isSubmitting ? 'Placing Order...' : `Place Order · ${formatCurrency(subtotal)}`}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export function OrderConfirmationView({
  order,
  isRefreshing,
  onStartNewOrder,
  onClose,
  restaurantName,
  tableNumber,
  coverImageUrl,
}: {
  order: Order
  isRefreshing: boolean
  onStartNewOrder?: () => void
  onClose?: () => void
  restaurantName?: string
  restaurantSlug?: string
  tableNumber?: string
  coverImageUrl?: string
}) {
  const statusText = order.status.replace(/_/g, ' ').toUpperCase()
  const isCompleted = order.status === 'completed'
  const isReady = order.status === 'ready_for_pickup'
  const isConfirmed = order.status === 'confirmed'

  const displayRestaurant =
    restaurantName ||
    (order as any)?.tables?.restaurants?.name ||
    (order as any)?.restaurants?.name ||
    'Sample Restaurant'
  const displayTable = tableNumber || (order as any)?.tables?.table_number || 'N/A'

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-background to-muted/20 pb-6 md:px-6 md:py-8">
      <div className="max-w-md mx-auto space-y-4 p-4 md:max-w-[28rem] md:overflow-hidden md:rounded-[28px] md:border md:bg-background md:shadow-2xl">
        {/* Hero — taller ratio */}
        <div className="relative overflow-hidden rounded-xl">
          <div
            className="h-[clamp(110px,22dvh,180px)] w-full bg-gradient-to-br from-primary/20 to-primary/5"
            style={coverImageUrl ? {
              backgroundImage: `url(${coverImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            } : undefined}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h1 className="text-xl font-bold drop-shadow-md">
              {displayRestaurant}
            </h1>
            <p className="text-white/80 text-sm mt-0.5">
              Table {displayTable}
            </p>
          </div>
        </div>

        <Card className="text-center">
          <CardContent className="pt-6 pb-5 px-5 space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold">
                {isReady ? 'Your food is ready!' : 'Order Placed!'}
              </h2>
              <p className="text-sm text-muted-foreground leading-snug">
                {isReady
                  ? "Our staff is bringing your order to your table now."
                  : isConfirmed
                    ? "Your payment is confirmed. We're on it!"
                    : "Show this code at the cashier to complete your payment."
                }
              </p>
            </div>

            <div className="py-3 px-4 bg-muted rounded-xl">
              <p className="text-xs text-muted-foreground mb-1">
                Confirmation Code
              </p>
              <p className="text-2xl font-bold tracking-wider font-mono">
                {order.confirmation_code}
              </p>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {isCompleted
                ? 'Your order is ready! Enjoy your meal.'
                : isReady
                  ? 'It is on the way to your table!'
                  : isConfirmed
                    ? 'Payment confirmed. Your order is being prepared.'
                    : 'Please show this code to complete your payment.'}
            </p>

            <Separator />

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Order Status</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Badge
                  variant={isCompleted ? 'default' : isReady ? 'secondary' : 'outline'}
                  className={`text-sm px-3 py-1.5 ${isReady ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800' : ''}`}
                >
                  {statusText}
                </Badge>
                {!isCompleted && (
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
                    />
                    <span>Live updates</span>
                  </div>
                )}
              </div>
            </div>

            {isCompleted && (
              <div className="flex flex-col gap-2 pt-1">
                {onStartNewOrder && (
                  <Button
                    variant="outline"
                    className="rounded-xl h-11"
                    onClick={onStartNewOrder}
                  >
                    Start a New Order
                  </Button>
                )}
                {onClose && (
                  <Button className="rounded-xl h-11" onClick={onClose}>
                    Close
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
