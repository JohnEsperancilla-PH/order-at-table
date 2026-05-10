-- Reusable modifier options per restaurant (labels + price deltas), copied onto menu items as drafts.

CREATE TABLE modifier_presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  price_modifier DECIMAL(10, 2) DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_modifier_presets_restaurant ON modifier_presets(restaurant_id);

CREATE TRIGGER update_modifier_presets_updated_at
  BEFORE UPDATE ON modifier_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE modifier_presets ENABLE ROW LEVEL SECURITY;
