export type OrderStatus = 
  | 'pending'
  | 'awaiting_cashier_confirmation'
  | 'confirmed'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled'

export type DiscountType = 'fixed' | 'percentage'

export interface Restaurant {
  id: string
  name: string
  description: string | null
  is_open: boolean
  opening_hours: string | null
  contact_number: string | null
  service_charge_rate?: number
  tax_rate?: number
  tax_mode?: 'inclusive' | 'exclusive'
  kitchen_cutoff_time?: string | null
  latitude: number | null
  longitude: number | null
  geofence_radius_meters: number | null
  geofence_enabled: boolean
  subscription_features: Record<string, boolean> | null
  created_at: string
  updated_at: string
}

export interface Table {
  id: string
  restaurant_id: string
  table_number: string
  capacity: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MenuCategory {
  id: string
  restaurant_id: string
  name: string
  description: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MenuItem {
  id: string
  restaurant_id: string
  category_id: string
  name: string
  description: string | null
  price: number
  cost_price?: number
  image_url: string | null
  display_order: number
  is_available: boolean
  created_at: string
  updated_at: string
  modifiers?: MenuItemModifier[]
}

export interface MenuItemModifier {
  id: string
  menu_item_id: string
  name: string
  price_modifier: number
  display_order: number
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  restaurant_id: string
  table_id: string
  confirmation_code: string
  status: OrderStatus
  subtotal: number
  discount_amount: number
  total_amount: number
  expires_at: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  customer_session_id?: string | null
  customer_name?: string | null
  idempotency_key?: string | null
  payment_verified_at?: string | null
  receipt_resent_count?: number
  cancelled_reason?: string | null
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  price: number
  modifier_id?: string | null
  special_instructions?: string | null
  created_at: string
  menu_item?: MenuItem
  menu_item_modifiers?: { id: string; name: string } | null
}

export interface DiscountCode {
  id: string
  restaurant_id: string
  code: string
  discount_type: DiscountType
  discount_value: number
  is_single_use: boolean
  expires_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OrderDiscount {
  id: string
  order_id: string
  discount_code_id: string
  discount_amount: number
  created_at: string
}

export interface Inventory {
  id: string
  menu_item_id: string
  is_available: boolean
  notes: string | null
  updated_at: string
}

export interface CartItem {
  lineId: string
  menu_item: MenuItem
  quantity: number
  modifier_id?: string | null
  modifier?: MenuItemModifier | null
  special_instructions?: string | null
}
