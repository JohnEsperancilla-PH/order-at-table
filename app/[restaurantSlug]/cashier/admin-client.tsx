'use client'

import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Search, CheckCircle2, XCircle, Eye, Inbox, Receipt, Filter, Loader2 } from 'lucide-react'
import { LiveIndicator } from '@/components/ui/live-indicator'
import { StatusBadge } from '@/components/ui/status-badge'
import { PageHeader } from '@/components/ui/page-header'
import { updateOrderStatus, getAllOrdersByRestaurantSlug, getOrdersByStatusAndRestaurantSlug, bulkUpdateOrderStatus, resendReceipt } from '@/lib/actions/orders'
import { Order, OrderStatus, Restaurant } from '@/lib/types'
import { format } from 'date-fns'
import { Label } from '@/components/ui/label'
import { cn, formatCurrency } from '@/lib/utils'
import { CounterOrderForm } from './CounterOrderForm'
import { printReceipt } from '@/lib/print-receipt'

const CASHIER_KEYBOARD_MODE_KEY = 'cashier-controls-keyboard-mode'
const CASHIER_BULK_OPTIONS_KEY = 'cashier-controls-bulk-options'
const CASHIER_LIVE_MODE_KEY = 'cashier-controls-live-mode'
const CASHIER_LIVE_INTERVAL_KEY = 'cashier-controls-live-interval-seconds'

interface AdminDashboardClientProps {
  initialOrders: any[]
  tables?: any[]
  menuItems?: any[]
  restaurantSlug: string
  restaurant?: Pick<Restaurant, 'name' | 'contact_number' | 'description'> | null
}

type CashierOrder = Order & {
  tables?: { table_number?: string }
  order_items?: Array<{ id: string }>
  customer_session_id?: string | null
  customer_name?: string | null
  confirmation_code?: string
  receipt_resent_count?: number
  expires_at?: string | null
}

// Memoized Order Card component
const OrderCard = memo(function OrderCard({
  order,
  enableBulkActions,
  isSelected,
  onToggleSelection,
  onResendReceipt,
  onDetails,
  onConfirmPayment,
  onUpdateStatus,
  onCancelRequest,
}: {
  order: CashierOrder
  enableBulkActions: boolean
  isSelected: boolean
  onToggleSelection: (id: string, checked: boolean) => void
  onResendReceipt: (id: string) => void
  onDetails: (order: CashierOrder) => void
  onConfirmPayment: (order: CashierOrder) => void
  onUpdateStatus: (id: string, status: OrderStatus) => void
  onCancelRequest: (id: string) => void
}) {
  const tableNumber = order.tables?.table_number || 'N/A'
  const isTableOrder = !!order.customer_session_id
  const receiptCount = order.receipt_resent_count || 0
  const isAwaiting = order.status === 'awaiting_cashier_confirmation'

  return (
    <Card
      className={cn(
        'stat-card flex h-full flex-col overflow-hidden py-0',
        isSelected && 'ring-2 ring-brand ring-offset-1 ring-offset-background',
        isAwaiting && 'border-warning/50',
        order.status === 'pending' && 'border-info/40',
      )}
    >
      <CardContent className="flex flex-1 flex-col gap-3 p-3.5">
        {/* Header — code + status side by side; meta underneath */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="num font-mono text-[18px] font-bold leading-none tracking-[0.06em]">
              {order.confirmation_code}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] text-muted-foreground">
              <span className="font-medium text-foreground">Table {tableNumber}</span>
              <span aria-hidden className="text-muted-foreground/50">·</span>
              <span>{format(new Date(order.created_at), 'MMM d, HH:mm')}</span>
            </div>
            {order.customer_name && (
              <p className="mt-1 truncate text-[12px]">
                <span className="text-muted-foreground">Customer </span>
                <span className="font-medium text-foreground">{order.customer_name}</span>
              </p>
            )}
          </div>
          <StatusBadge status={order.status as OrderStatus} className="shrink-0" />
        </div>

        {/* Source / receipts as small chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.04em]',
              isTableOrder
                ? 'border-brand/30 bg-brand/10 text-brand'
                : 'border-border bg-muted text-muted-foreground',
            )}
          >
            {isTableOrder ? 'Table' : 'Counter'}
          </span>
          {receiptCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
              <Receipt className="h-2.5 w-2.5" />
              {receiptCount}
            </span>
          )}
          {enableBulkActions && (
            <button
              type="button"
              onClick={() => onToggleSelection(order.id, !isSelected)}
              className={cn(
                'ml-auto inline-flex items-center rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.04em] transition-colors',
                isSelected
                  ? 'border-brand/40 bg-brand text-brand-foreground'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground',
              )}
            >
              {isSelected ? 'Selected' : 'Select'}
            </button>
          )}
        </div>

        {/* Items + total */}
        <div className="flex items-center justify-between rounded-md bg-secondary/60 px-3 py-2">
          <span className="text-[12.5px] text-muted-foreground">
            {order.order_items?.length || 0} {order.order_items?.length === 1 ? 'item' : 'items'}
          </span>
          <span className="num text-[15px] font-bold tracking-tight">
            {formatCurrency(order.total_amount)}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-[12.5px] text-muted-foreground hover:text-foreground"
            onClick={() => onDetails(order)}
          >
            <Eye className="h-3.5 w-3.5" />
            Details
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-[12.5px] text-muted-foreground hover:text-foreground"
            onClick={() => onResendReceipt(order.id)}
            title="Print receipt"
            aria-label="Print receipt"
          >
            <Receipt className="h-3.5 w-3.5" />
            Print
          </Button>

          <div className="ml-auto flex items-center gap-1.5">
            {isAwaiting && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onCancelRequest(order.id)}
                  aria-label="Cancel order"
                >
                  <XCircle className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  className="h-8 px-3 text-[12.5px] font-semibold"
                  onClick={() => onConfirmPayment(order)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Confirm
                </Button>
              </>
            )}
            {order.status === 'confirmed' && (
              <Button
                size="sm"
                className="h-8 px-3 text-[12.5px] font-semibold"
                onClick={() => onUpdateStatus(order.id, 'completed')}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Complete
              </Button>
            )}
            {order.status === 'ready_for_pickup' && (
              <Button
                size="sm"
                className="h-8 bg-warning px-3 text-[12.5px] font-semibold text-warning-foreground hover:bg-warning/90"
                onClick={() => onUpdateStatus(order.id, 'completed')}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Delivered
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

export function AdminDashboardClient({ initialOrders, tables = [], menuItems = [], restaurantSlug, restaurant = null }: AdminDashboardClientProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [orders, setOrders] = useState<CashierOrder[]>(initialOrders)
  const [searchCode, setSearchCode] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('incoming')
  const [isLoading, setIsLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [liveIntervalSeconds, setLiveIntervalSeconds] = useState(5)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchResultId, setSearchResultId] = useState<string | null>(null)
  const [showCounterOrderModal, setShowCounterOrderModal] = useState(false)
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)
  const [tableFilter, setTableFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [keyboardMode, setKeyboardMode] = useState(false)
  const [enableBulkActions, setEnableBulkActions] = useState(true)
  const [referenceNow, setReferenceNow] = useState(0)
  const [paymentOrder, setPaymentOrder] = useState<CashierOrder | null>(null)
  const [cashReceived, setCashReceived] = useState('')
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false)
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null)
  const [cancelBulkOrders, setCancelBulkOrders] = useState(false)
  
  const ordersRef = useRef(orders)
  ordersRef.current = orders
  const selectedOrderRef = useRef(selectedOrder)
  selectedOrderRef.current = selectedOrder

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (activeTab === 'incoming') {
        return ['pending', 'awaiting_cashier_confirmation', 'confirmed', 'ready_for_pickup'].includes(order.status)
      }
      return order.status === activeTab
    })
  }, [orders, activeTab])

  const uniqueTableNumbers = useMemo(() => {
    return Array.from(
      new Set(
        orders
          .map(order => String(order.tables?.table_number || ''))
          .filter(Boolean)
      )
    )
  }, [orders])

  const { awaitingCount, pendingCount, incomingCount } = useMemo(() => {
    return {
      awaitingCount: orders.filter(o => o.status === 'awaiting_cashier_confirmation').length,
      pendingCount: orders.filter(o => o.status === 'pending').length,
      incomingCount: orders.filter(o => ['pending', 'awaiting_cashier_confirmation', 'confirmed', 'ready_for_pickup'].includes(o.status)).length
    }
  }, [orders])

  const searchQuery = searchCode.trim().toUpperCase()
  
  const displayedOrders = useMemo(() => {
    return filteredOrders.filter(order => {
      const tableMatch =
        tableFilter === 'all' ||
        String(order.tables?.table_number || '') === tableFilter

      const statusMatch = statusFilter === 'all' || order.status === statusFilter

      const sourceMatch =
        sourceFilter === 'all' ||
        (sourceFilter === 'table' && !!order.customer_session_id) ||
        (sourceFilter === 'counter' && !order.customer_session_id)

      const orderAgeMs = referenceNow - new Date(order.created_at).getTime()
      const timeMatch =
        timeFilter === 'all' ||
        (timeFilter === '15m' && orderAgeMs <= 15 * 60 * 1000) ||
        (timeFilter === '1h' && orderAgeMs <= 60 * 60 * 1000) ||
        (timeFilter === 'today' && orderAgeMs <= 24 * 60 * 60 * 1000)

      const searchMatch =
        !searchQuery ||
        order.confirmation_code?.toUpperCase().includes(searchQuery)

      return tableMatch && statusMatch && sourceMatch && timeMatch && searchMatch
    })
  }, [filteredOrders, tableFilter, statusFilter, sourceFilter, timeFilter, referenceNow, searchQuery])

  const loadOrders = useCallback(async (status?: string, silent = false) => {
    if (!silent) setLoadError(null)
    setIsRefreshing(true)
    if (!silent) {
      setIsLoading(true)
    }
    try {
      const data = status && status !== 'all' && status !== 'incoming'
        ? await getOrdersByStatusAndRestaurantSlug(status, restaurantSlug)
        : await getAllOrdersByRestaurantSlug(restaurantSlug)
      
      const freshOrders = data as CashierOrder[]
      
      // Optimization: Only update state if data actually changed
      const currentHash = JSON.stringify(ordersRef.current)
      const freshHash = JSON.stringify(freshOrders)
      
      if (currentHash !== freshHash) {
        setOrders(freshOrders)
      }
      
      setLoadError(null)

      // Update selected order if it exists
      const currentSelected = selectedOrderRef.current
      if (currentSelected) {
        const updatedOrder = freshOrders.find((o) => o.id === currentSelected.id)
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
  }, [restaurantSlug])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const keyboardPref = localStorage.getItem(CASHIER_KEYBOARD_MODE_KEY)
    const bulkPref = localStorage.getItem(CASHIER_BULK_OPTIONS_KEY)
    const livePref = localStorage.getItem(CASHIER_LIVE_MODE_KEY)
    const intervalPref = localStorage.getItem(CASHIER_LIVE_INTERVAL_KEY)

    if (keyboardPref !== null) {
      setKeyboardMode(keyboardPref === 'true')
    }
    if (bulkPref !== null) {
      setEnableBulkActions(bulkPref === 'true')
    }
    if (livePref !== null) {
      setAutoRefresh(livePref === 'true')
    }
    if (intervalPref && ['5', '10', '15', '30'].includes(intervalPref)) {
      setLiveIntervalSeconds(Number(intervalPref))
    }

    const handleControlsUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{
        keyboardMode?: boolean
        bulkOptions?: boolean
        liveMode?: boolean
        liveIntervalSeconds?: number
      }>).detail

      if (typeof detail?.keyboardMode === 'boolean') {
        setKeyboardMode(detail.keyboardMode)
      }
      if (typeof detail?.bulkOptions === 'boolean') {
        setEnableBulkActions(detail.bulkOptions)
        if (!detail.bulkOptions) {
          setSelectedOrderIds([])
        }
      }
      if (typeof detail?.liveMode === 'boolean') {
        setAutoRefresh(detail.liveMode)
      }
      if (typeof detail?.liveIntervalSeconds === 'number' && [5, 10, 15, 30].includes(detail.liveIntervalSeconds)) {
        setLiveIntervalSeconds(detail.liveIntervalSeconds)
      }
    }

    const handleRefreshRequest = () => {
      loadOrders(activeTab === 'incoming' ? undefined : activeTab)
    }

    window.addEventListener('cashier-controls-update', handleControlsUpdate as EventListener)
    window.addEventListener('cashier-refresh-request', handleRefreshRequest)

    return () => {
      window.removeEventListener('cashier-controls-update', handleControlsUpdate as EventListener)
      window.removeEventListener('cashier-refresh-request', handleRefreshRequest)
    }
  }, [activeTab, restaurantSlug, loadOrders])

  useEffect(() => {
    if (activeTab) {
      loadOrders(activeTab === 'incoming' ? undefined : activeTab)
    }
  }, [activeTab, restaurantSlug, loadOrders])

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      loadOrders(activeTab === 'incoming' ? undefined : activeTab, true)
    }, liveIntervalSeconds * 1000)

    return () => clearInterval(interval)
  }, [autoRefresh, activeTab, restaurantSlug, liveIntervalSeconds, loadOrders])

  useEffect(() => {
    setReferenceNow(Date.now())
  }, [])

  useEffect(() => {
    const currentIds = new Set(orders.map((order) => order.id))
    setSelectedOrderIds(prev => prev.filter(id => currentIds.has(id)))
  }, [orders])

  const handleVerifyCode = useCallback(() => {
    const query = searchCode.trim().toUpperCase()
    if (!query) return

    const hasMatch = filteredOrders.some(order =>
      order.confirmation_code?.toUpperCase().includes(query)
    )

    setVerifyError(hasMatch ? null : 'Order not found')
    setSearchResultId(hasMatch ? query : null)
  }, [searchCode, filteredOrders])

  const handleUpdateStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    setStatusUpdateError(null)
    try {
      await updateOrderStatus(restaurantSlug, orderId, status as any)
      await loadOrders(activeTab)
      if (selectedOrderRef.current?.id === orderId) {
        setSelectedOrder(null)
      }
    } catch (error: unknown) {
      setStatusUpdateError(error instanceof Error ? error.message : 'Failed to update order status')
    }
  }, [restaurantSlug, activeTab, loadOrders])

  const toggleOrderSelection = useCallback((orderId: string, checked: boolean) => {
    setSelectedOrderIds(prev => {
      if (checked) {
        return prev.includes(orderId) ? prev : [...prev, orderId]
      }
      return prev.filter(id => id !== orderId)
    })
  }, [])

  const handleBulkStatusUpdate = useCallback(async (status: 'confirmed' | 'completed' | 'cancelled') => {
    if (selectedOrderIds.length === 0) return
    setStatusUpdateError(null)
    setIsBulkUpdating(true)

    try {
      await bulkUpdateOrderStatus(restaurantSlug, selectedOrderIds, status)
      setSelectedOrderIds([])
      await loadOrders(activeTab)
    } catch (error: unknown) {
      setStatusUpdateError(error instanceof Error ? error.message : 'Failed to bulk update orders')
    } finally {
      setIsBulkUpdating(false)
    }
  }, [restaurantSlug, selectedOrderIds, activeTab, loadOrders])

  const handleResendReceipt = useCallback(async (orderId: string) => {
    setStatusUpdateError(null)
    const order = ordersRef.current.find(o => o.id === orderId)
    if (!order) {
      setStatusUpdateError('Order not found')
      return
    }

    // Open the system print dialog immediately so the user can target a Bluetooth /
    // USB / AirPrint thermal printer that's been paired through the OS.
    try {
      printReceipt(order, restaurant)
    } catch (error: unknown) {
      setStatusUpdateError(error instanceof Error ? error.message : 'Failed to open print dialog')
      return
    }

    // Bookkeeping: bump the reprint counter + audit log in the background.
    // Don't surface failures here — the receipt has already been sent to the printer.
    void (async () => {
      try {
        await resendReceipt(restaurantSlug, orderId)
        await loadOrders(activeTab, true)
      } catch {
        // intentionally ignored — bookkeeping only
      }
    })()
  }, [restaurantSlug, activeTab, loadOrders, restaurant])

  const openPaymentDialog = useCallback((order: CashierOrder) => {
    setPaymentOrder(order)
    setCashReceived(String(order.total_amount ?? ''))
    setPaymentError(null)
  }, [])

  const handleConfirmPayment = useCallback(async () => {
    if (!paymentOrder) return

    const total = Number(paymentOrder.total_amount || 0)
    const received = Number(cashReceived)

    if (!Number.isFinite(received) || received <= 0) {
      setPaymentError('Enter a valid cash amount')
      return
    }

    if (received < total) {
      setPaymentError('Cash received is less than total amount due')
      return
    }

    setIsConfirmingPayment(true)
    setPaymentError(null)
    try {
      await updateOrderStatus(restaurantSlug, paymentOrder.id, 'confirmed', {
        cashReceived: received,
        changeAmount: received - total,
      })
      setPaymentOrder(null)
      setCashReceived('')
      await loadOrders(activeTab)
    } catch (error: unknown) {
      setPaymentError(error instanceof Error ? error.message : 'Failed to confirm payment')
    } finally {
      setIsConfirmingPayment(false)
    }
  }, [paymentOrder, cashReceived, restaurantSlug, activeTab, loadOrders])

  useEffect(() => {
    if (!keyboardMode) return

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTypingTarget = !!target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.getAttribute('contenteditable') === 'true'
      )

      if (isTypingTarget) return

      if (event.key === '/') {
        event.preventDefault()
        const searchInput = document.getElementById('confirmation-code') as HTMLInputElement | null
        searchInput?.focus()
      }
      if (event.key.toLowerCase() === 'n') {
        event.preventDefault()
        setShowCounterOrderModal(true)
      }
      if (event.key.toLowerCase() === 'r') {
        event.preventDefault()
        loadOrders(activeTab === 'incoming' ? undefined : activeTab)
      }
      if (event.key === '1') setActiveTab('incoming')
      if (event.key === '2') setActiveTab('completed')
      if (event.key === '3') setActiveTab('cancelled')
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [keyboardMode, activeTab, loadOrders])

  if (!isMounted) {
    return (
      <div className="space-y-4">
        <PageHeader title="Orders" description="Preparing cashier console..." />
        <Card className="gap-2 py-3">
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground/50" />
              <p className="text-sm">Loading interface...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
      <div className="flex h-[calc(100dvh-6.5rem)] flex-col gap-3 md:h-[calc(100dvh-8rem)]">
        <PageHeader title="Orders" description="Manage orders and verify confirmation codes">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground sm:justify-end">
              <Badge variant="outline" className="font-normal">In {incomingCount}</Badge>
              <Badge variant="outline" className="font-normal">Await {awaitingCount}</Badge>
              <Badge variant="outline" className="font-normal">Pend {pendingCount}</Badge>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowCounterOrderModal(true)}
              >
                + Counter Order
              </Button>
              {autoRefresh && (
                <Badge variant="outline" className="gap-1.5 text-muted-foreground">
                  <LiveIndicator color="success" />
                  Live
                </Badge>
              )}
            </div>
          </div>
        </PageHeader>

      {/* Orders Table — chrome stays put, only the grid scrolls */}
      <Card className="flex min-h-0 flex-1 flex-col gap-2 py-3 sm:gap-2.5 sm:py-4">
          <CardHeader className="shrink-0 space-y-0 px-4 pb-2 pt-2 sm:px-5">
            <div className="rounded-md border border-border/70 bg-muted/20 p-1.5 sm:p-2">
              <div className="flex flex-col gap-1.5 xl:flex-row xl:items-center xl:gap-2">
                <div className="grid min-w-0 grid-cols-2 gap-1.5 sm:grid-cols-4 xl:flex-1">
                <Select value={tableFilter} onValueChange={setTableFilter}>
                  <SelectTrigger className="h-9 w-full text-sm shadow-sm">
                    <SelectValue placeholder="Table" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tables</SelectItem>
                    {uniqueTableNumbers.map((tableNo) => (
                      <SelectItem key={tableNo} value={tableNo}>Table {tableNo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-full text-sm shadow-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="awaiting_cashier_confirmation">Awaiting payment</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="h-9 w-full text-sm shadow-sm">
                    <SelectValue placeholder="Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="15m">Last 15 min</SelectItem>
                    <SelectItem value="1h">Last 1 hour</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="h-9 w-full text-sm shadow-sm">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sources</SelectItem>
                    <SelectItem value="table">Table orders</SelectItem>
                    <SelectItem value="counter">Counter orders</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-1.5 xl:flex-nowrap xl:justify-end">
                <Label htmlFor="confirmation-code" className="sr-only">
                  Confirmation Code
                </Label>
                <Input
                  id="confirmation-code"
                  placeholder="Code…"
                  value={searchCode}
                  onChange={e => {
                    setSearchCode(e.target.value.toUpperCase())
                    if (verifyError) setVerifyError(null)
                    if (!e.target.value.trim()) setSearchResultId(null)
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyCode()}
                  className="h-9 min-w-0 flex-1 text-sm sm:min-w-[12rem] xl:max-w-[11rem] xl:flex-initial"
                  autoCapitalize="characters"
                  autoComplete="off"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVerifyCode}
                  disabled={!searchCode.trim()}
                  className="h-9 shrink-0 gap-1.5 px-2.5 sm:px-3"
                >
                  <Search className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Search</span>
                </Button>
                {searchResultId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 shrink-0 px-2 sm:px-3"
                    onClick={() => {
                      setSearchResultId(null)
                      setSearchCode('')
                      setVerifyError(null)
                    }}
                  >
                    Clear
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0 gap-1 px-2 sm:px-3"
                  title="Reset table, status, time, and source filters"
                  onClick={() => {
                    setTableFilter('all')
                    setStatusFilter('all')
                    setTimeFilter('all')
                    setSourceFilter('all')
                  }}
                >
                  <Filter className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">Reset</span>
                </Button>
              </div>
              </div>
              {verifyError && (
                <Alert variant="destructive" className="mt-1.5 py-2">
                  <AlertDescription>{verifyError}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col px-4 pb-3 pt-0 sm:px-5">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex min-h-0 flex-1 flex-col gap-1.5"
            >
              <TabsList className="grid h-8 w-full shrink-0 grid-cols-3 text-xs sm:text-sm [&_[data-slot=tabs-trigger]]:py-0">
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

              <TabsContent
                value={activeTab}
                className="mt-2 flex min-h-0 flex-1 flex-col"
              >
                {activeTab === 'incoming' && enableBulkActions && (
                  <div className="mb-2 rounded-lg border bg-muted/20 p-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs font-medium text-muted-foreground sm:text-sm">
                      {selectedOrderIds.length > 0
                        ? `${selectedOrderIds.length} order(s) selected`
                        : 'Bulk actions ready'}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs sm:text-sm"
                        onClick={() => setSelectedOrderIds(displayedOrders.map((o) => o.id))}
                      >
                        Select Visible
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs sm:text-sm"
                        onClick={() => setSelectedOrderIds([])}
                      >
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs sm:text-sm"
                        onClick={() => handleBulkStatusUpdate('confirmed')}
                        disabled={selectedOrderIds.length === 0 || isBulkUpdating}
                      >
                        Confirm Selected
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs sm:text-sm"
                        onClick={() => handleBulkStatusUpdate('completed')}
                        disabled={selectedOrderIds.length === 0 || isBulkUpdating}
                      >
                        Complete Selected
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 text-xs sm:text-sm"
                        onClick={() => setCancelBulkOrders(true)}
                        disabled={selectedOrderIds.length === 0 || isBulkUpdating}
                      >
                        Cancel Selected
                      </Button>
                    </div>
                  </div>
                )}
                {loadError && (
                  <Alert variant="destructive" className="mb-2 py-2">
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
                  <Alert variant="destructive" className="mb-2 py-2">
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
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-7 w-7 animate-spin text-muted-foreground/50" />
                    <p className="text-sm">Loading orders...</p>
                  </div>
                ) : displayedOrders.length === 0 ? (
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Inbox className="h-9 w-9 text-muted-foreground/30 sm:h-10 sm:w-10" />
                    <p className="text-sm">{searchResultId ? 'No matching order found' : 'No orders in this view'}</p>
                  </div>
                ) : (
                  <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-1">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {displayedOrders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          enableBulkActions={enableBulkActions}
                          isSelected={selectedOrderIds.includes(order.id)}
                          onToggleSelection={toggleOrderSelection}
                          onResendReceipt={handleResendReceipt}
                          onDetails={setSelectedOrder}
                          onConfirmPayment={openPaymentDialog}
                          onUpdateStatus={handleUpdateStatus}
                          onCancelRequest={setCancelOrderId}
                        />
                      ))}
                    </div>
                  </div>
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
                <StatusBadge status={selectedOrder.status as OrderStatus} />
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
                  {(selectedOrder as CashierOrder).order_items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start gap-2 px-3 py-2.5"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {item.menu_items?.name || 'Unknown Item'}
                        </p>
                        {item.menu_item_modifiers?.name && (
                          <p className="text-[11px] text-primary font-medium mt-0.5">
                            {item.menu_item_modifiers.name}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} &times; {formatCurrency(item.price)}
                        </p>
                        {item.special_instructions?.trim() && (
                          <p className="text-xs text-warning-muted-foreground mt-1.5 leading-snug whitespace-pre-wrap">
                            {item.special_instructions.trim()}
                          </p>
                        )}
                      </div>
                      <p className="font-semibold text-sm tabular-nums shrink-0">
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
                  <div className="flex justify-between text-sm text-success">
                    <span>Discount</span>
                    <span className="tabular-nums">-{formatCurrency(selectedOrder.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-1">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => selectedOrder && handleResendReceipt(selectedOrder.id)}
                  className="flex-1"
                >
                  <Receipt className="h-4 w-4" />
                  Print Receipt
                </Button>
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

      <Dialog
        open={!!paymentOrder}
        onOpenChange={(open) => {
          if (!open) {
            setPaymentOrder(null)
            setCashReceived('')
            setPaymentError(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cash Payment</DialogTitle>
            <DialogDescription>
              Enter cash received before confirming payment.
            </DialogDescription>
          </DialogHeader>
          {paymentOrder && (
            <div className="space-y-4">
              {paymentError && (
                <Alert variant="destructive">
                  <AlertDescription>{paymentError}</AlertDescription>
                </Alert>
              )}
              <div className="rounded-lg border p-3 space-y-1">
                <p className="text-sm text-muted-foreground">Order</p>
                <p className="font-mono text-lg font-semibold">{paymentOrder.confirmation_code}</p>
                <p className="text-sm text-muted-foreground">Table {paymentOrder.tables?.table_number || 'N/A'}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Due</span>
                <span className="text-lg font-bold tabular-nums">{formatCurrency(Number(paymentOrder.total_amount || 0))}</span>
              </div>
              <div>
                <Label htmlFor="cash-received">Cash Received</Label>
                <Input
                  id="cash-received"
                  type="number"
                  min="0"
                  step="0.01"
                  value={cashReceived}
                  onChange={(event) => {
                    setCashReceived(event.target.value)
                    if (paymentError) setPaymentError(null)
                  }}
                  placeholder="Enter amount"
                />
              </div>
              <div className="rounded-lg border p-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Change</span>
                <span className="text-base font-semibold tabular-nums">
                  {formatCurrency(Math.max(0, Number(cashReceived || 0) - Number(paymentOrder.total_amount || 0)))}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setPaymentOrder(null)
                    setCashReceived('')
                    setPaymentError(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleConfirmPayment}
                  disabled={isConfirmingPayment}
                >
                  {isConfirmingPayment ? 'Confirming...' : 'Confirm Payment'}
                </Button>
              </div>
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

      {/* Cancel single order confirmation */}
      <AlertDialog open={!!cancelOrderId} onOpenChange={(open) => { if (!open) setCancelOrderId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the order as cancelled. The customer will no longer see it as active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep order</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (cancelOrderId) {
                  handleUpdateStatus(cancelOrderId, 'cancelled')
                  setCancelOrderId(null)
                }
              }}
            >
              Cancel order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel bulk orders confirmation */}
      <AlertDialog open={cancelBulkOrders} onOpenChange={setCancelBulkOrders}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {selectedOrderIds.length} order{selectedOrderIds.length !== 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark all selected orders as cancelled. Affected customers will no longer see them as active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep orders</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                handleBulkStatusUpdate('cancelled')
                setCancelBulkOrders(false)
              }}
            >
              Cancel {selectedOrderIds.length} order{selectedOrderIds.length !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

