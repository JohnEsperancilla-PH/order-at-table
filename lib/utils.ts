import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "PHP", locale = "en-PH") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function hasFeature(
  restaurant: { subscription_features?: Record<string, boolean> | null } | null,
  feature: string
): boolean {
  if (!restaurant?.subscription_features) return false
  return restaurant.subscription_features[feature] === true
}
