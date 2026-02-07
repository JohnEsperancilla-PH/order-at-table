-- Add customer session and name to orders
ALTER TABLE orders
  ADD COLUMN customer_session_id VARCHAR(64),
  ADD COLUMN customer_name VARCHAR(255);

-- Optional index for faster lookups by session
CREATE INDEX IF NOT EXISTS idx_orders_customer_session ON orders(customer_session_id);
