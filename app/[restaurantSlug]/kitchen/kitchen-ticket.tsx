'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
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
    <Card className="stat-card flex h-full flex-col overflow-hidden py-0">
      <CardHeader className="border-b border-border/70 bg-secondary/50 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="num font-mono text-[18px] font-semibold tracking-[0.08em]">
              {order.confirmation_code}
            </p>
            <div className="mt-0.5 flex items-center gap-2 text-[12px] text-muted-foreground">
              <span className="font-semibold text-foreground">
                Table {order.tables?.table_number || 'N/A'}
              </span>
              <span aria-hidden>·</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {waitTime} ago
              </span>
            </div>
          </div>
          {order.customer_name && (
            <Badge
              variant="outline"
              className="max-w-[120px] truncate border-border bg-background text-[11px] font-medium"
            >
              {order.customer_name}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {order.order_items?.map((item: any) => (
          <div key={item.id} className="space-y-1.5">
            <div className="flex items-start gap-2">
              <span className="num shrink-0 text-[15px] font-semibold text-brand">
                {item.quantity}×
              </span>
              <div className="min-w-0">
                <p className="text-[14.5px] font-semibold leading-snug tracking-tight">
                  {item.menu_items?.name || 'Unknown Item'}
                </p>
                {item.menu_item_modifiers?.name && (
                  <p className="mt-0.5 text-[12.5px] font-medium text-muted-foreground">
                    {item.menu_item_modifiers.name}
                  </p>
                )}
              </div>
            </div>

            {item.special_instructions?.trim() && (
              <div className="ml-7 flex gap-2 rounded-md border border-warning/30 bg-warning/10 p-2">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                <p className="whitespace-pre-wrap text-[12.5px] font-medium leading-snug text-warning-muted-foreground">
                  {item.special_instructions.trim()}
                </p>
              </div>
            )}
          </div>
        ))}
      </CardContent>

      <div className="border-t border-border/70 bg-secondary/30 p-3">
        <Button
          className="h-11 w-full text-[13.5px] font-semibold tracking-wide"
          onClick={handleComplete}
          disabled={isCompleting}
        >
          {isCompleting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Marking ready…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Ready for pickup
            </>
          )}
        </Button>
      </div>
    </Card>
  )
})
