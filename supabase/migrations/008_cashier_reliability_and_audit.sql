-- Reliability and operations enhancements

-- Add idempotency + verification metadata to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100),
  ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS receipt_resent_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancelled_reason TEXT;

-- Ensure retries cannot create duplicate orders for the same restaurant request
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_restaurant_idempotency_key
  ON orders(restaurant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Configurable restaurant business rules
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS service_charge_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_mode VARCHAR(20) NOT NULL DEFAULT 'exclusive',
  ADD COLUMN IF NOT EXISTS kitchen_cutoff_time TIME;

ALTER TABLE restaurants
  DROP CONSTRAINT IF EXISTS chk_restaurants_tax_mode;

ALTER TABLE restaurants
  ADD CONSTRAINT chk_restaurants_tax_mode
  CHECK (tax_mode IN ('inclusive', 'exclusive'));

-- Item-level cost to enable margin analytics
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- Audit trail for sensitive actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  actor_type VARCHAR(50) NOT NULL DEFAULT 'system',
  actor_id VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_restaurant_created
  ON audit_logs(restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON audit_logs(action);
