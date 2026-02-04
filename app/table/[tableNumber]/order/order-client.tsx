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
import { ShoppingCart, Minus, CheckCircle2, X, RefreshCw, Plus } from 'lucide-react'
import { createOrder, getOrderById } from '@/lib/actions/orders'
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

  const filteredItems = useMemo(() => menuItems, [menuItems])

  useEffect(() => {
    if (!addedMessage) return
    const timeout = setTimeout(() => setAddedMessage(null), 2000)
    return () => clearTimeout(timeout)
  }, [addedMessage])

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(ci => ci.menu_item.id === item.id)
      if (existing) {
        return prev.map(ci =>
          ci.menu_item.id === item.id
            ? { ...ci, quantity: ci.quantity + 1 }
            : ci
        )
      }
      return [...prev, { menu_item: item, quantity: 1 }]
    })
    setAddedMessage(`${item.name} added to cart`)
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(ci => ci.menu_item.id !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }
    setCart(prev =>
      prev.map(ci =>
        ci.menu_item.id === itemId ? { ...ci, quantity } : ci
      )
    )
  }

  const subtotal = cart.reduce(
    (sum, item) => sum + item.menu_item.price * item.quantity,
    0
  )

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
      const orderItems = cart.map(item => ({
        menu_item_id: item.menu_item.id,
        quantity: item.quantity,
        price: item.menu_item.price,
      }))

      const order = await createOrder(
        table.id,
        table.restaurant_id,
        orderItems,
        discountCode.trim() || undefined
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
      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{table.restaurants.name}</h1>
          <p className="text-muted-foreground">
            Table {table.table_number}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Section */}
          <div className="lg:col-span-2 space-y-4">
            {addedMessage && (
              <div className="fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
                <Alert>
                  <AlertDescription>{addedMessage}</AlertDescription>
                </Alert>
              </div>
            )}

            {/* Menu Items by Category */}
            <MenuAccordion
              categories={categories}
              menuItems={filteredItems}
              onAddToCart={addToCart}
            />
          </div>

          {/* Cart Section */}
          {!isMobile && (
            <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Cart ({cartItemCount})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Your cart is empty
                  </p>
                ) : (
                  <>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {cart.map(item => (
                          <div
                            key={item.menu_item.id}
                            className="flex items-start justify-between gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">
                                {item.menu_item.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(item.menu_item.price)} each
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                aria-label={`Decrease quantity for ${item.menu_item.name}`}
                                onClick={() =>
                                  updateQuantity(
                                    item.menu_item.id,
                                    item.quantity - 1
                                  )
                                }
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center text-sm">
                                {item.quantity}
                              </span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                aria-label={`Increase quantity for ${item.menu_item.name}`}
                                onClick={() =>
                                  updateQuantity(
                                    item.menu_item.id,
                                    item.quantity + 1
                                  )
                                }
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive"
                                aria-label={`Remove ${item.menu_item.name} from cart`}
                                onClick={() => removeFromCart(item.menu_item.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleOpenConfirm}
                      disabled={cart.length === 0 || isSubmitting}
                    >
                      Confirm Order
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
          <div className="fixed bottom-4 left-4 right-4 z-40">
            <Button
              className="w-full"
              size="lg"
              onClick={() => setIsCartOpen(true)}
              disabled={cartItemCount === 0}
            >
              View Cart ({cartItemCount})
            </Button>
          </div>
          <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
            <SheetContent side="bottom" className="h-[85vh]">
              <SheetHeader>
                <SheetTitle>Cart</SheetTitle>
                <SheetDescription>Review your items before placing the order.</SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-4">
                {cart.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Your cart is empty
                  </p>
                ) : (
                  <div className="space-y-4">
                    <ScrollArea className="h-[45vh]">
                      <div className="space-y-3">
                        {cart.map(item => (
                          <div
                            key={item.menu_item.id}
                            className="flex items-start justify-between gap-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">
                                {item.menu_item.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatCurrency(item.menu_item.price)} each
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                aria-label={`Decrease quantity for ${item.menu_item.name}`}
                                onClick={() =>
                                  updateQuantity(
                                    item.menu_item.id,
                                    item.quantity - 1
                                  )
                                }
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center text-sm">
                                {item.quantity}
                              </span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                aria-label={`Increase quantity for ${item.menu_item.name}`}
                                onClick={() =>
                                  updateQuantity(
                                    item.menu_item.id,
                                    item.quantity + 1
                                  )
                                }
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-destructive"
                                aria-label={`Remove ${item.menu_item.name} from cart`}
                                onClick={() => removeFromCart(item.menu_item.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleOpenConfirm}
                      disabled={cart.length === 0 || isSubmitting}
                    >
                      Confirm Order
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Order</DialogTitle>
            <DialogDescription>
              Review your order and enter a discount code if you have one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div>
              <Label htmlFor="discount-code">Discount Code (Optional)</Label>
              <Input
                id="discount-code"
                value={discountCode}
                onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                autoCapitalize="characters"
                autoComplete="off"
                placeholder="Enter code"
                className="mt-1"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmOrder}
                disabled={isSubmitting || cart.length === 0}
                className="flex-1"
              >
                {isSubmitting ? 'Placing Order...' : 'Place Order'}
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
}: {
  order: Order
  isRefreshing: boolean
  onStartNewOrder?: () => void
  onClose?: () => void
}) {
  const statusText = order.status.replace(/_/g, ' ').toUpperCase()
  const isCompleted = order.status === 'completed'
  const isConfirmed = order.status === 'confirmed'

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="max-w-md mx-auto pt-20">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Order Placed!</CardTitle>
            <CardDescription>
              Your order has been submitted successfully. Show this code at the cashier.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Confirmation Code
              </p>
              <p className="text-3xl font-bold tracking-wider">
                {order.confirmation_code}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {isCompleted
                ? 'Your order is coming your way. Enjoy!'
                : isConfirmed
                  ? 'Payment confirmed. Your order is being prepared.'
                  : 'Please show this code to the cashier to complete your payment.'}
            </p>
            <div className="pt-4 space-y-2">
              <p className="text-sm font-medium">Order Status</p>
              <div className="flex items-center justify-center gap-2">
                <Badge 
                  variant={isCompleted ? 'default' : 'outline'} 
                  className="text-base px-4 py-2"
                >
                  {statusText}
                </Badge>
                {!isCompleted && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <RefreshCw 
                      className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
                    />
                    <span>{isRefreshing ? 'Updating status...' : 'Live updates on'}</span>
                  </div>
                )}
              </div>
            </div>
            {isCompleted && (
              <div className="flex flex-col gap-2">
                {onStartNewOrder && (
                  <Button
                    variant="outline"
                    onClick={onStartNewOrder}
                  >
                    Start a New Order
                  </Button>
                )}
                {onClose && (
                  <Button onClick={onClose}>Close</Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

