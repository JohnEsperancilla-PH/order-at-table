-- Add pin_code column to tables for on-premise ordering verification
-- NULL means no PIN required (backward compatible), non-NULL means PIN is required
ALTER TABLE tables
  ADD COLUMN pin_code VARCHAR(4) DEFAULT NULL;

-- Add constraint to ensure pin_code is exactly 4 digits when not null
ALTER TABLE tables
  ADD CONSTRAINT tables_pin_code_check CHECK (pin_code IS NULL OR pin_code ~ '^[0-9]{4}$');
