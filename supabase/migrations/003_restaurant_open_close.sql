-- Add open/close, opening hours, and contact number to restaurants
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS opening_hours TEXT,
  ADD COLUMN IF NOT EXISTS contact_number TEXT;

-- Update seed restaurant
UPDATE restaurants
  SET is_open = true
  WHERE id = '00000000-0000-0000-0000-000000000001';
