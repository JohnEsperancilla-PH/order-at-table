-- Enable Realtime for the orders table
-- This allows Supabase to broadcast changes via WebSockets
alter publication supabase_realtime add table orders;

-- Optional: If you want to see item-level changes in real-time
-- alter publication supabase_realtime add table order_items;
