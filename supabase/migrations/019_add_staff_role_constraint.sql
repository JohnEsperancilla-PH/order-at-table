-- Add CHECK constraint for staff_accounts.role to enforce valid role values
-- Valid roles: 'owner', 'manager', 'staff', 'kitchen'
-- 'kitchen' role can only access the kitchen display
-- 'staff' role can only access cashier pages (orders, menu, categories)

ALTER TABLE staff_accounts
  ADD CONSTRAINT staff_accounts_role_check
  CHECK (role IN ('owner', 'manager', 'staff', 'kitchen'));
