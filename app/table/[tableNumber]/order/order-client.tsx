'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ShoppingCart, Plus, Minus, CheckCircle2, X, RefreshCw } from 'lucide-react'
import { createOrder, getActiveOrder } from '@/lib/actions/orders'
import { CartItem, MenuItem, MenuCategory, Order } from '@/lib/types'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useEffect } from 'react'

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
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [discountCode, setDiscountCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderPlaced, setOrderPlaced] = useState<Order | null>(activeOrder)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Auto-refresh order status if there's an active order
  useEffect(() => {
    if (!orderPlaced) return

    const interval = setInterval(async () => {
      try {
        setIsRefreshing(true)
        const updatedOrder = await getActiveOrder(table.id)
        if (updatedOrder && updatedOrder.id === orderPlaced.id) {
          setOrderPlaced(updatedOrder)
        } else if (!updatedOrder && orderPlaced.status === 'completed') {
          // Order was completed, stop refreshing
          clearInterval(interval)
        }
      } catch (error) {
        console.error('Failed to refresh order status:', error)
      } finally {
        setIsRefreshing(false)
      }
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [orderPlaced, table.id])

  const filteredItems = useMemo(() => {
    if (!selectedCategory) return menuItems
    return menuItems.filter(item => item.category_id === selectedCategory)
  }, [menuItems, selectedCategory])

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
    } catch (err: any) {
      setError(err.message || 'Failed to place order')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (orderPlaced) {
    const statusText = orderPlaced.status.replace(/_/g, ' ').toUpperCase()
    const isCompleted = orderPlaced.status === 'completed'
    const isConfirmed = orderPlaced.status === 'confirmed'
    
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
                Your order has been submitted successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Confirmation Code
                </p>
                <p className="text-3xl font-bold tracking-wider">
                  {orderPlaced.confirmation_code}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {isCompleted
                  ? 'Your order has been completed. Thank you!'
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
                    <RefreshCw 
                      className={`w-4 h-4 text-muted-foreground ${isRefreshing ? 'animate-spin' : ''}`} 
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
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
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={
                    selectedCategory === category.id ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>

            {/* Menu Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredItems.map(item => (
                <Card key={item.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        {item.description && (
                          <CardDescription className="mt-1">
                            {item.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge
                        variant={item.is_available ? 'default' : 'secondary'}
                        className="ml-2"
                      >
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">
                        ${item.price.toFixed(2)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => addToCart(item)}
                        disabled={!item.is_available}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Cart Section */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
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
                                ${item.menu_item.price.toFixed(2)} each
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
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
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => setShowConfirmDialog(true)}
                    >
                      Confirm Order
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirm Order Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
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
                placeholder="Enter code"
                className="mt-1"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${subtotal.toFixed(2)}</span>
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

