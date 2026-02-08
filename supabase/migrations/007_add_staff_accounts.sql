-- Create staff_accounts table for restaurant staff authentication
CREATE TABLE staff_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'staff', -- 'owner', 'manager', 'staff'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint on email per restaurant (staff can have same email across restaurants)
CREATE UNIQUE INDEX idx_staff_accounts_restaurant_email ON staff_accounts(restaurant_id, email);

-- Create index for faster lookups
CREATE INDEX idx_staff_accounts_restaurant_id ON staff_accounts(restaurant_id);
CREATE INDEX idx_staff_accounts_email ON staff_accounts(email);
