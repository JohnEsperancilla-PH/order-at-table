-- Add 'ready_for_pickup' to the status check constraint on orders table
ALTER TABLE orders DROP CONSTRAINT orders_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'awaiting_cashier_confirmation', 'confirmed', 'ready_for_pickup', 'completed', 'cancelled'));
