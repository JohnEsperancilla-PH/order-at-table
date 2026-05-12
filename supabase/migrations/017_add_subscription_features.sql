-- Add subscription_features JSONB column for feature-gating per restaurant
-- Example: { "kitchen": true, "future_feature": false }
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS subscription_features JSONB DEFAULT '{}'::jsonb;
