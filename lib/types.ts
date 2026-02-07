export type OrderStatus = 
  | 'pending'
  | 'awaiting_cashier_confirmation'
  | 'confirmed'
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
  image_url: string | null
  display_order: number
  is_available: boolean
  created_at: string
  updated_at: string
  sizes?: Size[]
}

export interface Size {
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
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  price: number
  size_id?: string | null
  created_at: string
  menu_item?: MenuItem
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
  menu_item: MenuItem
  quantity: number
  size_id?: string | null
  size?: Size | null
}

