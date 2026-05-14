'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Order, OrderItem } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import { memo, useState } from 'react'

interface KitchenTicketProps {
  order: any
  onComplete: (orderId: string) => Promise<void>
}

export const KitchenTicket = memo(function KitchenTicket({ order, onComplete }: KitchenTicketProps) {
  const [isCompleting, setIsCompleting] = useState(false)

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      await onComplete(order.id)
    } finally {
      setIsCompleting(false)
    }
  }

  const orderTime = new Date(order.created_at)
  const waitTime = formatDistanceToNow(orderTime)

  return (
    <Card className="flex flex-col h-full border shadow-sm">
      <CardHeader className="bg-muted/50 py-3 px-4 border-b">
        <div className="flex justify-between items-start gap-2">
          <div>
            <p className="font-mono text-xl font-bold tracking-wider">
              {order.confirmation_code}
            </p>
            <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Table {order.tables?.table_number || 'N/A'}</span>
              <span>&middot;</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {waitTime} ago
              </span>
            </div>
          </div>
          {order.customer_name && (
            <Badge variant="secondary" className="max-w-[120px] truncate">
              {order.customer_name}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {order.order_items?.map((item: any) => (
            <div key={item.id} className="space-y-1">
              <div className="flex justify-between items-start gap-3">
                <div className="flex gap-2 items-start min-w-0">
                  <span className="text-lg font-bold text-brand shrink-0">{item.quantity}x</span>
                  <div className="min-w-0">
                    <p className="text-base font-semibold leading-tight">
                      {item.menu_items?.name || 'Unknown Item'}
                    </p>
                    {item.menu_item_modifiers?.name && (
                      <p className="text-sm font-medium text-primary mt-0.5">
                        {item.menu_item_modifiers.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {item.special_instructions?.trim() && (
                <div className="ml-7 p-2 rounded-md bg-warning-muted border-warning/20 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-warning-muted-foreground leading-snug whitespace-pre-wrap">
                    {item.special_instructions.trim()}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
      
      <div className="p-4 bg-muted/20 border-t">
        <Button 
          className="w-full h-14 text-lg font-bold shadow-md hover:shadow-lg transition-all" 
          onClick={handleComplete}
          disabled={isCompleting}
        >
          {isCompleting ? (
            'MARKING READY...'
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              READY FOR PICKUP
            </>
          )}
        </Button>
      </div>
    </Card>
  )
})
