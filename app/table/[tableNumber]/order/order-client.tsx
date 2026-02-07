'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ShoppingCart, Minus, CheckCircle2, X, RefreshCw, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { createOrder, getOrderById, getActiveOrderForSession } from '@/lib/actions/orders'
import { CartItem, MenuItem, MenuCategory, Order } from '@/lib/types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRouter } from 'next/navigation'
import { useIsMobile } from '@/hooks/use-mobile'
import { formatCurrency } from '@/lib/utils'
import { MenuAccordion } from './menu-accordion'

interface OrderPageClientProps {
  table: any
  categories: MenuCategory[]
  menuItems: any[]
  activeOrder: Order | null
}

export function OrderPageClient({
  table,
  categories,
  menuItems,
  activeOrder,
}: OrderPageClientProps) {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerName, setCustomerName] = useState<string | null>(null)
  const [customerSessionId, setCustomerSessionId] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [discountCode, setDiscountCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderPlaced, setOrderPlaced] = useState<Order | null>(activeOrder)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [addedMessage, setAddedMessage] = useState<string | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const isMobile = useIsMobile()

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
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [orderPlaced?.id])

  // Load (or resume) session for this table from localStorage
  useEffect(() => {
    if (!table?.id) return
    try {
      const key = `order_session_${table.id}`
      const stored = typeof window !== 'undefined' ? localStorage.getItem(key) : null
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.id) {
          setCustomerSessionId(parsed.id)
          if (parsed.name) setCustomerName(parsed.name)
          ;(async () => {
            try {
              const sessionOrder = await getActiveOrderForSession(table.id, parsed.id)
              if (sessionOrder) setOrderPlaced(sessionOrder)
            } catch (err) {
              console.error('Failed to load session order:', err)
            }
          })()
        }
      }
    } catch (err) {
      console.error('Failed to parse session:', err)
    }
  }, [table?.id])

  const filteredItems = useMemo(() => menuItems, [menuItems])

  useEffect(() => {
    if (!addedMessage) return
    const timeout = setTimeout(() => setAddedMessage(null), 2000)
    return () => clearTimeout(timeout)
  }, [addedMessage])

  const addToCart = (item: MenuItem, sizeId?: string | null) => {
    setCart(prev => {
      // Find existing item with the same menu_item_id AND size_id
      const existingIndex = prev.findIndex(
        ci => ci.menu_item.id === item.id && (ci.size_id || null) === (sizeId || null)
      )
      
      if (existingIndex >= 0) {
        // Increase quantity if same item and size already exists
        const newCart = [...prev]
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newCart[existingIndex].quantity + 1
        }
        return newCart
      }
      
      // Add new item with size
      return [...prev, { menu_item: item, quantity: 1, size_id: sizeId || null }]
    })
    
    // Find the size name if sizeId is provided
    const size = item.sizes?.find((s: any) => s.id === sizeId)
    const sizeText = size ? ` (${size.name})` : ''
    setAddedMessage(`${item.name}${sizeText} added to cart`)
  }

  const removeFromCart = (itemId: string, sizeId?: string | null) => {
    setCart(prev => prev.filter(ci => !(ci.menu_item.id === itemId && (ci.size_id || null) === (sizeId || null))))
  }

  const updateQuantity = (itemId: string, quantity: number, sizeId?: string | null) => {
    if (quantity <= 0) {
      removeFromCart(itemId, sizeId)
      return
    }
    setCart(prev =>
      prev.map(ci =>
        ci.menu_item.id === itemId && (ci.size_id || null) === (sizeId || null)
          ? { ...ci, quantity }
          : ci
      )
    )
  }

  const subtotal = cart.reduce((sum, item) => {
    const itemPrice = item.size
      ? item.menu_item.price + item.size.price_modifier
      : item.menu_item.price
    return sum + itemPrice * item.quantity
  }, 0)

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleOpenConfirm = () => {
    if (isMobile) {
      setIsCartOpen(false)
    }
    setShowConfirmDialog(true)
  }

  const handleConfirmOrder = async () => {
    if (cart.length === 0) {
      setError('Your cart is empty')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Ensure customer name/session exists
      if (!customerName || !customerName.trim()) {
        setError('Please enter your name before placing the order')
        setIsSubmitting(false)
        return
      }

      // Create or persist a session id for this customer on this table
      let sessionId = customerSessionId
      if (!sessionId) {
        sessionId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
          ? (crypto as any).randomUUID()
          : `sess_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
        setCustomerSessionId(sessionId)
        try {
          const key = `order_session_${table.id}`
          localStorage.setItem(key, JSON.stringify({ id: sessionId, name: customerName }))
        } catch (e) {
          // ignore localStorage errors
        }
      }

      const orderItems = cart.map(item => {
        const itemPrice = item.size
          ? item.menu_item.price + item.size.price_modifier
          : item.menu_item.price
        return {
          menu_item_id: item.menu_item.id,
          quantity: item.quantity,
          price: itemPrice,
          size_id: item.size_id || undefined,
        }
      })

      const order = await createOrder(
        table.id,
        table.restaurant_id,
        orderItems,
        discountCode.trim() || undefined,
        sessionId ?? undefined,
        customerName ?? undefined
      )

      setOrderPlaced(order)
      setCart([])
      setDiscountCode('')
      setShowConfirmDialog(false)
      router.replace(`/table/${table.table_number}/orders/${order.id}/${order.status}`)
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
        restaurantName={table.restaurants?.name}
        tableNumber={table.table_number}
        coverImageUrl={table.restaurants?.cover_image_url}
        onStartNewOrder={() => setOrderPlaced(null)}
        onClose={() => {
          router.replace(`/table/${table.table_number}`)
        }}
      />
    )
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-b from-background to-muted/20 ${
        isMobile ? 'pb-24' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Hero with restaurant info overlay */}
        <div className="relative overflow-hidden rounded-2xl">
          <div
            className="aspect-[21/9] w-full bg-gradient-to-br from-primary/20 to-primary/5"
            style={table.restaurants?.cover_image_url ? {
              backgroundImage: `url(${table.restaurants.cover_image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : undefined}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <h1 className="text-2xl sm:text-3xl font-bold drop-shadow-md">
              {table.restaurants?.name || 'Sample Restaurant'}
            </h1>
            <p className="text-white/80 text-sm mt-1">
              Table {table.table_number}
            </p>
          </div>
        </div>

        {customerName && (
          <p className="text-2xl font-bold text-foreground mb-6">
            Welcome, {customerName}!
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Menu Section */}
          <div className="lg:col-span-2 space-y-4">
            {addedMessage && (
              <div className="fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="flex items-center gap-3 bg-primary text-primary-foreground px-4 py-3 rounded-xl shadow-lg">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium">{addedMessage}</span>
                </div>
              </div>
            )}

            {/* Menu Items by Category */}
            <MenuAccordion
              categories={categories}
              menuItems={filteredItems}
              cart={cart}
              onAddToCart={addToCart}
              onUpdateQuantity={updateQuantity}
            />
          </div>

          {/* Cart Section */}
          {!isMobile && (
            <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    <span>Cart</span>
                  </div>
                  {cartItemCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/40" />
                    <p className="text-muted-foreground text-sm">Your cart is empty</p>
                    <p className="text-muted-foreground/60 text-xs">Add items from the menu to get started</p>
                  </div>
                ) : (
                  <>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-1">
                        {cart.map((item, idx) => {
                          const itemPrice = item.size ? item.menu_item.price + item.size.price_modifier : item.menu_item.price
                          const lineTotal = itemPrice * item.quantity
                          const cartKey = `${item.menu_item.id}-${item.size_id || 'nosize'}`
                          
                          return (
                            <div
                              key={cartKey}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm leading-tight">
                                  {item.menu_item.name}
                                </p>
                                {item.size && (
                                  <p className="text-[11px] text-primary font-medium">
                                    {item.size.name}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {formatCurrency(itemPrice)} &times; {item.quantity} = <span className="font-semibold text-foreground">{formatCurrency(lineTotal)}</span>
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7 rounded-full"
                                  aria-label={`Decrease quantity for ${item.menu_item.name}`}
                                  onClick={() =>
                                    updateQuantity(
                                      item.menu_item.id,
                                      item.quantity - 1,
                                      item.size_id
                                    )
                                  }
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-6 text-center text-sm font-semibold tabular-nums">
                                  {item.quantity}
                                </span>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-7 w-7 rounded-full"
                                  aria-label={`Increase quantity for ${item.menu_item.name}`}
                                  onClick={() =>
                                    updateQuantity(
                                      item.menu_item.id,
                                      item.quantity + 1,
                                      item.size_id
                                    )
                                  }
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                  aria-label={`Remove ${item.menu_item.name} from cart`}
                                  onClick={() => removeFromCart(item.menu_item.id, item.size_id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                    <Separator />
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                    </div>
                    <Button
                      className="w-full rounded-xl transition-transform active:scale-[0.98]"
                      size="lg"
                      onClick={handleOpenConfirm}
                      disabled={cart.length === 0 || isSubmitting}
                    >
                      Confirm Order &middot; {formatCurrency(subtotal)}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
            </div>
          )}
        </div>
      </div>

      {isMobile && (
        <>
          <div className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-background/80 backdrop-blur-lg border-t safe-bottom">
            <Button
              className="w-full rounded-xl h-12 text-base transition-transform active:scale-[0.98]"
              size="lg"
              onClick={() => setIsCartOpen(true)}
              disabled={cartItemCount === 0}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
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
          <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl !h-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span>Your Cart</span>
                  <Badge variant="secondary">{cartItemCount}</Badge>
                </SheetTitle>
                <SheetDescription>Review your items before placing the order.</SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-4">
                {cart.length === 0 ? (
                  <div className="text-center py-10 space-y-3">
                    <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/40" />
                    <p className="text-muted-foreground text-sm">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ScrollArea className="max-h-[45vh]">
                      <div className="space-y-1">
                        {cart.map((item, idx) => {
                          const itemPrice = item.size ? item.menu_item.price + item.size.price_modifier : item.menu_item.price
                          const lineTotal = itemPrice * item.quantity
                          const cartKey = `${item.menu_item.id}-${item.size_id || 'nosize'}`
                          
                          return (
                            <div
                              key={cartKey}
                              className="flex items-center gap-3 p-2.5 rounded-lg"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm leading-tight">
                                  {item.menu_item.name}
                                </p>
                                {item.size && (
                                  <p className="text-[11px] text-primary font-medium">
                                    {item.size.name}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {formatCurrency(itemPrice)} &times; {item.quantity} = <span className="font-semibold text-foreground">{formatCurrency(lineTotal)}</span>
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8 rounded-full"
                                  aria-label={`Decrease quantity for ${item.menu_item.name}`}
                                  onClick={() =>
                                    updateQuantity(
                                      item.menu_item.id,
                                      item.quantity - 1,
                                      item.size_id
                                    )
                                  }
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-6 text-center text-sm font-semibold tabular-nums">
                                  {item.quantity}
                                </span>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8 rounded-full"
                                  aria-label={`Increase quantity for ${item.menu_item.name}`}
                                  onClick={() =>
                                    updateQuantity(
                                      item.menu_item.id,
                                      item.quantity + 1,
                                      item.size_id
                                    )
                                  }
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  aria-label={`Remove ${item.menu_item.name} from cart`}
                                  onClick={() => removeFromCart(item.menu_item.id, item.size_id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                    <Separator />
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                    </div>
                    <Button
                      className="w-full rounded-xl h-12 text-base transition-transform active:scale-[0.98]"
                      size="lg"
                      onClick={handleOpenConfirm}
                      disabled={cart.length === 0 || isSubmitting}
                    >
                      Confirm Order &middot; {formatCurrency(subtotal)}
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}

      {/* Confirm Order Dialog */}
      <Dialog
        open={showConfirmDialog}
        onOpenChange={(open) => {
          if (isSubmitting) return
          setShowConfirmDialog(open)
          if (open) setError(null)
        }}
      >
        <DialogContent className="max-w-md px-6 sm:px-8">
          <DialogHeader>
            <DialogTitle className="text-lg">Confirm Your Order</DialogTitle>
            <DialogDescription className="text-sm">
              Review your order and apply a discount code if you have one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Order summary */}
            <div className="rounded-xl border bg-muted/30 divide-y max-h-44 overflow-y-auto">
              {cart.map(item => {
                const price = item.size
                  ? item.menu_item.price + item.size.price_modifier
                  : item.menu_item.price
                const cartKey = `${item.menu_item.id}-${item.size_id || 'nosize'}`
                return (
                  <div key={cartKey} className="flex justify-between items-center px-4 py-2.5 text-sm">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{item.menu_item.name}</span>
                      {item.size && (
                        <span className="text-muted-foreground text-xs ml-1">({item.size.name})</span>
                      )}
                      <span className="text-muted-foreground ml-1">&times;{item.quantity}</span>
                    </div>
                    <span className="font-medium tabular-nums ml-3">{formatCurrency(price * item.quantity)}</span>
                  </div>
                )
              })}
            </div>

            <div>
              <Label htmlFor="customer-name" className="text-sm">Your Name</Label>
              <Input
                id="customer-name"
                value={customerName ?? ''}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="e.g., Alice"
                className="mt-1.5 h-11"
              />

              <div className="mt-3">
                <Label htmlFor="discount-code" className="text-sm">Discount Code (Optional)</Label>
                <Input
                  id="discount-code"
                  value={discountCode}
                  onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                  autoCapitalize="characters"
                  autoComplete="off"
                  placeholder="Enter code"
                  className="mt-1.5 h-11"
                />
              </div>
            </div>
            <Separator />
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 rounded-xl h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmOrder}
                disabled={isSubmitting || cart.length === 0}
                className="flex-1 rounded-xl h-11 transition-transform active:scale-[0.97]"
              >
                {isSubmitting ? 'Placing Order...' : `Place Order · ${formatCurrency(subtotal)}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
  tableNumber?: string
  coverImageUrl?: string
}) {
  const statusText = order.status.replace(/_/g, ' ').toUpperCase()
  const isCompleted = order.status === 'completed'
  const isConfirmed = order.status === 'confirmed'

  const displayRestaurant =
    restaurantName ||
    (order as any)?.tables?.restaurants?.name ||
    (order as any)?.restaurants?.name ||
    'Sample Restaurant'
  const displayTable = tableNumber || (order as any)?.tables?.table_number || 'N/A'

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-background to-muted/20 px-4 pb-6">
      <div className="max-w-md mx-auto pt-4 space-y-3">
        {/* Compact hero */}
        <div className="relative overflow-hidden rounded-xl">
          <div
            className="aspect-[21/9] w-full bg-gradient-to-br from-primary/20 to-primary/5"
            style={coverImageUrl ? { backgroundImage: `url(${coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h1 className="text-xl font-bold drop-shadow-md">
              {displayRestaurant}
            </h1>
            <p className="text-white/80 text-xs mt-0.5">
              You are seated at Table {displayTable}
            </p>
          </div>
        </div>

        <Card className="text-center">
          <CardContent className="pt-6 pb-5 px-5 space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold">Order Placed!</h2>
              <p className="text-sm text-muted-foreground leading-snug">
                Your order has been submitted successfully. Show this code at the cashier.
              </p>
            </div>

            <div className="py-3 px-4 bg-muted rounded-xl">
              <p className="text-xs text-muted-foreground mb-1">
                Confirmation Code
              </p>
              <p className="text-2xl font-bold tracking-wider">
                {order.confirmation_code}
              </p>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {isCompleted
                ? 'Your order is coming your way. Enjoy!'
                : isConfirmed
                  ? 'Payment confirmed. Your order is being prepared.'
                  : 'Please show this code to the cashier to complete your payment.'}
            </p>

            <Separator />

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Order Status</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Badge 
                  variant={isCompleted ? 'default' : 'outline'} 
                  className="text-sm px-3 py-1.5"
                >
                  {statusText}
                </Badge>
                {!isCompleted && (
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <RefreshCw 
                      className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} 
                    />
                    <span>Live updates on</span>
                  </div>
                )}
              </div>
            </div>

            {isCompleted && (
              <div className="flex flex-col gap-2 pt-1">
                {onStartNewOrder && (
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={onStartNewOrder}
                  >
                    Start a New Order
                  </Button>
                )}
                {onClose && (
                  <Button className="rounded-xl" onClick={onClose}>Close</Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

