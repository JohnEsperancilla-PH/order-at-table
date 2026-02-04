'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Search, CheckCircle2, XCircle, Clock, Package, Eye, RefreshCw } from 'lucide-react'
import { updateOrderStatus, getAllOrders, getOrdersByStatus } from '@/lib/actions/orders'
import { Order, OrderStatus } from '@/lib/types'
import { format } from 'date-fns'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'

interface AdminDashboardClientProps {
  initialOrders: any[]
}

export function AdminDashboardClient({ initialOrders }: AdminDashboardClientProps) {
  const [orders, setOrders] = useState(initialOrders)
  const [searchCode, setSearchCode] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchResultId, setSearchResultId] = useState<string | null>(null)

  const loadOrders = async (status?: string, silent = false) => {
    setIsRefreshing(true)
    if (!silent) {
      setIsLoading(true)
    }
    try {
      const data = status && status !== 'all'
        ? await getOrdersByStatus(status)
        : await getAllOrders()
      setOrders(data)
      
      // Update selected order if it exists
      if (selectedOrder) {
        const updatedOrder = data.find((o: any) => o.id === selectedOrder.id)
        if (updatedOrder) {
          setSelectedOrder(updatedOrder)
        }
      }
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (activeTab) {
      loadOrders(activeTab === 'all' ? undefined : activeTab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadOrders(activeTab === 'all' ? undefined : activeTab, true)
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, activeTab])

  const handleVerifyCode = () => {
    const query = searchCode.trim().toUpperCase()
    if (!query) return

    const hasMatch = filteredOrders.some(order =>
      order.confirmation_code?.toUpperCase().includes(query)
    )

    setVerifyError(hasMatch ? null : 'Order not found')
    setSearchResultId(hasMatch ? query : null)
  }

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status as any)
      await loadOrders(activeTab)
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null)
      }
    } catch (error: any) {
      alert(error.message || 'Failed to update order status')
    }
  }

  const getStatusBadge = (status: OrderStatus) => {
    const variants: Record<OrderStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      awaiting_cashier_confirmation: 'secondary',
      confirmed: 'default',
      completed: 'default',
      cancelled: 'destructive',
    }

    const icons: Record<OrderStatus, any> = {
      pending: Clock,
      awaiting_cashier_confirmation: Package,
      confirmed: CheckCircle2,
      completed: CheckCircle2,
      cancelled: XCircle,
    }

    const Icon = icons[status]

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status.replace(/_/g, ' ').toUpperCase()}
      </Badge>
    )
  }

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true
    return order.status === activeTab
  })

  const searchQuery = searchCode.trim().toUpperCase()
  const displayedOrders = searchQuery
    ? filteredOrders.filter(order =>
        order.confirmation_code?.toUpperCase().includes(searchQuery)
      )
    : filteredOrders

  const awaitingCount = orders.filter(o => o.status === 'awaiting_cashier_confirmation').length
  const pendingCount = orders.filter(o => o.status === 'pending').length

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="text-muted-foreground">
              Manage orders and verify confirmation codes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <Label htmlFor="auto-refresh" className="cursor-pointer">
                Auto-refresh
              </Label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadOrders(activeTab === 'all' ? undefined : activeTab)}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

      {/* Orders Table */}
      <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Orders</CardTitle>
              <CardDescription>
                View and manage all orders
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <Label htmlFor="confirmation-code" className="sr-only">
                  Confirmation Code
                </Label>
                <Input
                  id="confirmation-code"
                  placeholder="Search code"
                  value={searchCode}
                  onChange={e => {
                    setSearchCode(e.target.value.toUpperCase())
                    if (verifyError) setVerifyError(null)
                    if (!e.target.value.trim()) setSearchResultId(null)
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyCode()}
                  className="w-full md:w-56"
                  autoCapitalize="characters"
                  autoComplete="off"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVerifyCode}
                  disabled={!searchCode.trim()}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                {searchResultId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchResultId(null)
                      setSearchCode('')
                      setVerifyError(null)
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
              {verifyError && (
                <Alert variant="destructive" className="sm:ml-2">
                  <AlertDescription>{verifyError}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">
                  Pending
                  {pendingCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {pendingCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="awaiting_cashier_confirmation">
                  Awaiting
                  {awaitingCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {awaitingCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading orders...
                  </div>
                ) : displayedOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchResultId ? 'No matching order found' : 'No orders found'}
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {displayedOrders.map((order: any) => (
                        <Card key={order.id} className="overflow-hidden border border-border/80 shadow-sm">
                          <CardContent className="space-y-4 p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Code</p>
                                <p className="font-mono text-xl font-semibold">
                                  {order.confirmation_code}
                                </p>
                              </div>
                              {getStatusBadge(order.status)}
                            </div>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <span>Table {order.tables?.table_number || 'N/A'}</span>
                              <span>{format(new Date(order.created_at), 'MMM d, HH:mm')}</span>
                            </div>
                            <div className="rounded-md bg-muted/40 px-3 py-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Total</span>
                                <span className="text-lg font-semibold">
                                  {formatCurrency(order.total_amount)}
                                </span>
                              </div>
                            </div>
                            <div
                              className={`grid gap-2 ${
                                order.status === 'awaiting_cashier_confirmation'
                                  ? '[grid-template-columns:80px_1fr_1fr]'
                                  : order.status === 'confirmed'
                                    ? '[grid-template-columns:80px_1fr]'
                                    : '[grid-template-columns:80px]'
                              }`}
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                  const found = orders.find((o: any) => o.id === order.id)
                                  setSelectedOrder(found || order)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                              {order.status === 'awaiting_cashier_confirmation' && (
                                <>
                                  <Button
                                    size="sm"
                                    className="w-full"
                                    onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                    Confirm
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Cancel
                                  </Button>
                                </>
                              )}
                              {order.status === 'confirmed' && (
                                <Button
                                  size="sm"
                                  className="w-full"
                                  onClick={() => handleUpdateStatus(order.id, 'completed')}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Complete
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      {/* Order Detail Dialog */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={open => !open && setSelectedOrder(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Confirmation Code: {selectedOrder?.confirmation_code}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Table</p>
                  <p className="font-medium">
                    {(selectedOrder as any).tables?.table_number || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(new Date(selectedOrder.created_at), 'PPpp')}
                  </p>
                </div>
                {(selectedOrder as any).restaurants && (
                  <div>
                    <p className="text-sm text-muted-foreground">Restaurant</p>
                    <p className="font-medium">
                      {(selectedOrder as any).restaurants.name}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <p className="font-medium mb-2">Order Items</p>
                <div className="space-y-2">
                  {(selectedOrder as any).order_items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-2 bg-muted rounded"
                    >
                      <div>
                        <p className="font-medium">
                          {item.menu_items?.name || 'Unknown Item'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      </div>
                      <p className="font-medium">
                        {formatCurrency(item.quantity * item.price)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedOrder.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

