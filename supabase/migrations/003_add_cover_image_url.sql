-- Add cover image URL to restaurants
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
