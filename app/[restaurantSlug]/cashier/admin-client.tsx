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
import { Search, CheckCircle2, XCircle, Clock, Package, Eye, RefreshCw, Inbox } from 'lucide-react'
import { updateOrderStatus, getAllOrdersByRestaurantSlug, getOrdersByStatusAndRestaurantSlug } from '@/lib/actions/orders'
import { Order, OrderStatus } from '@/lib/types'
import { format } from 'date-fns'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'
import { CounterOrderForm } from './CounterOrderForm'

interface AdminDashboardClientProps {
  initialOrders: any[]
  tables?: any[]
  menuItems?: any[]
  restaurantSlug: string
}

export function AdminDashboardClient({ initialOrders, tables = [], menuItems = [], restaurantSlug }: AdminDashboardClientProps) {
  const [orders, setOrders] = useState(initialOrders)
  const [searchCode, setSearchCode] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('incoming')
  const [isLoading, setIsLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchResultId, setSearchResultId] = useState<string | null>(null)
  const [showCounterOrderModal, setShowCounterOrderModal] = useState(false)
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadOrders = async (status?: string, silent = false) => {
    if (!silent) setLoadError(null)
    setIsRefreshing(true)
    if (!silent) {
      setIsLoading(true)
    }
    try {
      const data = status && status !== 'all' && status !== 'incoming'
        ? await getOrdersByStatusAndRestaurantSlug(status, restaurantSlug)
        : await getAllOrdersByRestaurantSlug(restaurantSlug)
      setOrders(data)
      setLoadError(null)

      // Update selected order if it exists
      if (selectedOrder) {
        const updatedOrder = data.find((o: any) => o.id === selectedOrder.id)
        if (updatedOrder) {
          setSelectedOrder(updatedOrder)
        }
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to load orders')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (activeTab) {
      loadOrders(activeTab === 'incoming' ? undefined : activeTab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, restaurantSlug])

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadOrders(activeTab === 'incoming' ? undefined : activeTab, true)
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, activeTab, restaurantSlug])

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
    setStatusUpdateError(null)
    try {
      await updateOrderStatus(restaurantSlug, orderId, status as any)
      await loadOrders(activeTab)
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null)
      }
    } catch (error: unknown) {
      setStatusUpdateError(error instanceof Error ? error.message : 'Failed to update order status')
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
    if (activeTab === 'incoming') {
      return ['pending', 'awaiting_cashier_confirmation', 'confirmed'].includes(order.status)
    }
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
  const incomingCount = orders.filter(o => ['pending', 'awaiting_cashier_confirmation', 'confirmed'].includes(o.status)).length

  return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="text-muted-foreground">
              Manage orders and verify confirmation codes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowCounterOrderModal(true)}
            >
              + Counter Order
            </Button>
            <div className="flex items-center gap-2 text-sm">
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <Label htmlFor="auto-refresh" className="cursor-pointer text-sm text-muted-foreground">
                Live
              </Label>
              {autoRefresh && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadOrders(activeTab === 'incoming' ? undefined : activeTab)}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="incoming">
                  Incoming
                  {incomingCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {incomingCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {loadError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription className="flex items-center justify-between gap-2">
                      <span>{loadError}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 -m-1"
                        onClick={() => {
                          setLoadError(null)
                          loadOrders(activeTab === 'incoming' ? undefined : activeTab)
                        }}
                      >
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                {statusUpdateError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription className="flex items-center justify-between gap-2">
                      <span>{statusUpdateError}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 -m-1"
                        onClick={() => setStatusUpdateError(null)}
                      >
                        Dismiss
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground/50" />
                    <p className="text-sm">Loading orders...</p>
                  </div>
                ) : displayedOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                    <Inbox className="w-12 h-12 text-muted-foreground/30" />
                    <p className="text-sm">{searchResultId ? 'No matching order found' : 'No orders in this view'}</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {displayedOrders.map((order: any) => (
                        <Card
                          key={order.id}
                          className={`overflow-hidden transition-all duration-200 hover:shadow-md ${
                            order.status === 'awaiting_cashier_confirmation'
                              ? 'border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/10'
                              : order.status === 'pending'
                                ? 'border-blue-200 dark:border-blue-800'
                                : ''
                          }`}
                        >
                          <CardContent className="space-y-3 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-mono text-xl font-bold tracking-wider">
                                  {order.confirmation_code}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                  <span>Table {order.tables?.table_number || 'N/A'}</span>
                                  <span className="text-muted-foreground/40">&middot;</span>
                                  <span>{format(new Date(order.created_at), 'MMM d, HH:mm')}</span>
                                </div>
                                {order.customer_name && (
                                  <div className="mt-2 text-sm">
                                    <span className="text-muted-foreground">Customer: </span>
                                    <span className="font-medium text-foreground">{order.customer_name}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-2 items-end">
                                {getStatusBadge(order.status)}
                                <Badge variant={order.customer_session_id ? 'secondary' : 'outline'}>
                                  {order.customer_session_id ? 'Table Order' : 'Counter Order'}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                              <span className="text-sm text-muted-foreground">{(order as any).order_items?.length || '—'} items</span>
                              <span className="text-lg font-bold tabular-nums">
                                {formatCurrency(order.total_amount)}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-3 text-xs"
                                onClick={() => {
                                  const found = orders.find((o: any) => o.id === order.id)
                                  setSelectedOrder(found || order)
                                }}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                Details
                              </Button>
                              {order.status === 'awaiting_cashier_confirmation' && (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-8 px-4 text-xs flex-1"
                                    onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                    Confirm Payment
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-3 text-xs text-destructive hover:text-destructive"
                                    onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </Button>
                                </>
                              )}
                              {order.status === 'confirmed' && (
                                <Button
                                  size="sm"
                                  className="h-8 px-4 text-xs flex-1"
                                  onClick={() => handleUpdateStatus(order.id, 'completed')}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                  Mark Complete
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
            <div className="space-y-5">
              {/* Status + meta row */}
              <div className="flex items-center justify-between">
                {getStatusBadge(selectedOrder.status)}
                <span className="text-xs text-muted-foreground">
                  {format(new Date(selectedOrder.created_at), 'PPpp')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Table</p>
                  <p className="text-lg font-semibold">
                    {(selectedOrder as any).tables?.table_number || 'N/A'}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Total</p>
                  <p className="text-lg font-bold tabular-nums">
                    {formatCurrency(selectedOrder.total_amount)}
                  </p>
                </div>
              </div>

              {selectedOrder.customer_name && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Customer Name</p>
                  <p className="text-lg font-semibold">
                    {selectedOrder.customer_name}
                  </p>
                </div>
              )}

              <Separator />

              <div>
                <p className="text-sm font-semibold mb-2">Items</p>
                <div className="rounded-lg border divide-y">
                  {(selectedOrder as any).order_items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center px-3 py-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {item.menu_items?.name || 'Unknown Item'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} &times; {formatCurrency(item.price)}
                        </p>
                      </div>
                      <p className="font-semibold text-sm tabular-nums ml-3">
                        {formatCurrency(item.quantity * item.price)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span className="tabular-nums">-{formatCurrency(selectedOrder.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-1">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => setSelectedOrder(null)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CounterOrderForm
        open={showCounterOrderModal}
        onOpenChange={setShowCounterOrderModal}
        tables={tables}
        menuItems={menuItems}
        onOrderCreated={() => loadOrders(activeTab === 'incoming' ? undefined : activeTab)}
      />
    </div>
  )
}

