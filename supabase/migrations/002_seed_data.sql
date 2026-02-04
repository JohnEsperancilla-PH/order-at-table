-- Seed data for development/testing

-- Insert a sample restaurant
INSERT INTO restaurants (id, name, description) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Sample Restaurant', 'A sample restaurant for testing the order system');

-- Insert sample tables
INSERT INTO tables (id, restaurant_id, table_number, capacity) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '1', 4),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '2', 2),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '3', 6),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '4', 4);

-- Insert menu categories
INSERT INTO menu_categories (id, restaurant_id, name, description, display_order) VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Appetizers', 'Start your meal right', 1),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Main Courses', 'Hearty and delicious', 2),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Desserts', 'Sweet endings', 3),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Beverages', 'Refreshing drinks', 4);

-- Insert menu items
INSERT INTO menu_items (id, restaurant_id, category_id, name, description, price, display_order, is_available) VALUES
  -- Appetizers
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Caesar Salad', 'Fresh romaine lettuce with Caesar dressing', 8.99, 1, true),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Bruschetta', 'Toasted bread with tomatoes and basil', 7.99, 2, true),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Mozzarella Sticks', 'Crispy fried mozzarella with marinara', 9.99, 3, true),
  
  -- Main Courses
  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Grilled Chicken', 'Tender grilled chicken breast with vegetables', 16.99, 1, true),
  ('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Beef Burger', 'Classic beef burger with fries', 14.99, 2, true),
  ('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Pasta Carbonara', 'Creamy pasta with bacon and parmesan', 15.99, 3, true),
  ('30000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'Salmon Fillet', 'Pan-seared salmon with rice', 18.99, 4, true),
  
  -- Desserts
  ('30000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'Chocolate Cake', 'Rich chocolate layer cake', 7.99, 1, true),
  ('30000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', 'Ice Cream Sundae', 'Vanilla ice cream with toppings', 6.99, 2, true),
  
  -- Beverages
  ('30000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'Coca Cola', 'Classic cola drink', 2.99, 1, true),
  ('30000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'Orange Juice', 'Fresh squeezed orange juice', 3.99, 2, true),
  ('30000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'Coffee', 'Hot brewed coffee', 2.49, 3, true);

-- Insert inventory records
INSERT INTO inventory (menu_item_id, is_available) 
SELECT id, is_available FROM menu_items;

-- Insert sample discount codes
INSERT INTO discount_codes (id, restaurant_id, code, discount_type, discount_value, is_single_use, expires_at, is_active) VALUES
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'WELCOME10', 'percentage', 10.00, false, NULL, true),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'SAVE5', 'fixed', 5.00, false, NULL, true),
  ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'ONETIME20', 'percentage', 20.00, true, NULL, true);

