-- Sizes table for drinks
CREATE TABLE sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  price_modifier DECIMAL(10, 2) DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add size_id to order_items table
ALTER TABLE order_items
ADD COLUMN size_id UUID REFERENCES sizes(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX idx_sizes_menu_item ON sizes(menu_item_id);
CREATE INDEX idx_order_items_size ON order_items(size_id);

-- Trigger for updated_at
CREATE TRIGGER update_sizes_updated_at BEFORE UPDATE ON sizes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
