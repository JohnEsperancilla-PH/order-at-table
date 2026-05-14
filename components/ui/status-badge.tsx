"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LiveIndicator } from "@/components/ui/live-indicator";
import {
  Clock,
  Package,
  CheckCircle2,
  Bell,
  XCircle,
} from "lucide-react";
import type { ComponentProps } from "react";

type OrderStatus =
  | "pending"
  | "awaiting_cashier_confirmation"
  | "confirmed"
  | "ready_for_pickup"
  | "completed"
  | "cancelled";

type StatusVariant = OrderStatus | "open" | "closed";

interface StatusBadgeProps extends ComponentProps<typeof Badge> {
  status: StatusVariant;
}

const statusConfig: Record<
  StatusVariant,
  { icon: React.ReactNode; label: string; className: string }
> = {
  pending: {
    icon: <Clock className="h-3 w-3" />,
    label: "Pending",
    className: "border-info/30 bg-info-muted text-info-muted-foreground",
  },
  awaiting_cashier_confirmation: {
    icon: <Package className="h-3 w-3" />,
    label: "Awaiting Payment",
    className: "border-warning/40 bg-warning-muted text-warning-muted-foreground",
  },
  confirmed: {
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: "Confirmed",
    className: "border-success/30 bg-success-muted text-success-muted-foreground",
  },
  ready_for_pickup: {
    icon: <Bell className="h-3 w-3" />,
    label: "Ready for Pickup",
    className: "border-warning/50 bg-warning-muted text-warning-muted-foreground",
  },
  completed: {
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: "Completed",
    className: "border-success/30 bg-success-muted text-success-muted-foreground",
  },
  cancelled: {
    icon: <XCircle className="h-3 w-3" />,
    label: "Cancelled",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  open: {
    icon: <LiveIndicator color="white" />,
    label: "Open Now",
    className: "border-success/30 bg-success text-success-foreground",
  },
  closed: {
    icon: null,
    label: "Closed",
    className: "border-destructive/20 text-destructive",
  },
};

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const config = statusConfig[status];
  if (!config) return null;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1", config.className, className)}
      {...props}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}
