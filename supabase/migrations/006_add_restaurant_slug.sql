-- Add slug column to restaurants table
ALTER TABLE restaurants ADD COLUMN slug VARCHAR(255) UNIQUE;

-- Function to generate URL-safe slug from name
CREATE OR REPLACE FUNCTION generate_slug(text) RETURNS text AS $$
  SELECT lower(
    regexp_replace(
      regexp_replace($1, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+',
      '-',
      'g'
    )
  );
$$ LANGUAGE SQL;

-- Update existing restaurants with slugs (fallback to restaurant ID if needed)
UPDATE restaurants 
SET slug = COALESCE(
  NULLIF(generate_slug(name), ''),
  CONCAT('restaurant-', SUBSTR(id::text, 1, 8))
)
WHERE slug IS NULL;

-- Make slug non-nullable after populating
ALTER TABLE restaurants ALTER COLUMN slug SET NOT NULL;

-- Create index for faster slug lookups
CREATE INDEX idx_restaurants_slug ON restaurants(slug);
