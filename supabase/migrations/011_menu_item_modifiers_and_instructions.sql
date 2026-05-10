-- Generalize "sizes" into menu_item_modifiers (drink choice, portion, add-ons, etc.)
-- and capture per-line allergy / kitchen notes on orders.

ALTER TABLE sizes RENAME TO menu_item_modifiers;

ALTER INDEX idx_sizes_menu_item RENAME TO idx_menu_item_modifiers_menu_item;
ALTER INDEX idx_order_items_size RENAME TO idx_order_items_modifier;

ALTER TRIGGER update_sizes_updated_at ON menu_item_modifiers
  RENAME TO update_menu_item_modifiers_updated_at;

ALTER TABLE order_items RENAME COLUMN size_id TO modifier_id;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS special_instructions TEXT;
