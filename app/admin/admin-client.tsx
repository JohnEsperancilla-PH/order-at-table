'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Search, CheckCircle2, XCircle, Clock, Package, Eye, RefreshCw } from 'lucide-react'
import { verifyOrderByCode, updateOrderStatus, getAllOrders, getOrdersByStatus } from '@/lib/actions/orders'
import { Order, OrderStatus } from '@/lib/types'
import { format } from 'date-fns'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface AdminDashboardClientProps {
  initialOrders: any[]
}

export function AdminDashboardClient({ initialOrders }: AdminDashboardClientProps) {
  const [orders, setOrders] = useState(initialOrders)
  const [searchCode, setSearchCode] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadOrders = async (status?: string, silent = false) => {
    if (!silent) {
      setIsLoading(true)
    } else {
      setIsRefreshing(true)
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

  const handleVerifyCode = async () => {
    if (!searchCode.trim()) return

    setIsVerifying(true)
    setVerifyError(null)

    try {
      const order = await verifyOrderByCode(searchCode.toUpperCase())
      if (order) {
        setSelectedOrder(order)
      } else {
        setVerifyError('Order not found')
      }
    } catch (error: any) {
      setVerifyError(error.message || 'Failed to verify order')
    } finally {
      setIsVerifying(false)
    }
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

        {/* Verify Code Section */}
        <Card>
          <CardHeader>
            <CardTitle>Verify Order by Code</CardTitle>
            <CardDescription>
              Enter a confirmation code to view and manage an order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter confirmation code"
                value={searchCode}
                onChange={e => setSearchCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleVerifyCode()}
                className="flex-1"
              />
              <Button
                onClick={handleVerifyCode}
                disabled={isVerifying || !searchCode.trim()}
              >
                <Search className="w-4 h-4 mr-2" />
                {isVerifying ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
            {verifyError && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{verifyError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

      {/* Orders Table */}
      <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>
              View and manage all orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="awaiting_cashier_confirmation">
                  Awaiting
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
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No orders found
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Table</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order: any) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono font-bold">
                              {order.confirmation_code}
                            </TableCell>
                            <TableCell>
                              {order.tables?.table_number || 'N/A'}
                            </TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                            <TableCell>
                              {format(new Date(order.created_at), 'MMM d, HH:mm')}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const found = orders.find((o: any) => o.id === order.id)
                                  setSelectedOrder(found || order)
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
                          Qty: {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-medium">
                        ${(item.quantity * item.price).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${selectedOrder.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${selectedOrder.total_amount.toFixed(2)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                {selectedOrder.status === 'awaiting_cashier_confirmation' && (
                  <>
                    <Button
                      onClick={() =>
                        handleUpdateStatus(selectedOrder.id, 'confirmed')
                      }
                      className="flex-1"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Confirm Payment
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() =>
                        handleUpdateStatus(selectedOrder.id, 'cancelled')
                      }
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}
                {selectedOrder.status === 'confirmed' && (
                  <Button
                    onClick={() =>
                      handleUpdateStatus(selectedOrder.id, 'completed')
                    }
                    className="flex-1"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark as Completed
                  </Button>
                )}
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

