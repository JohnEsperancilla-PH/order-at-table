-- Add geolocation columns to restaurants table
ALTER TABLE restaurants
  ADD COLUMN latitude DECIMAL(10, 8),
  ADD COLUMN longitude DECIMAL(11, 8),
  ADD COLUMN geofence_radius_meters INTEGER DEFAULT 100;

-- Update existing restaurants with a dummy location (optional, can be updated via UI later)
UPDATE restaurants SET 
  latitude = 10.7202, -- Example coordinates (Bacolod City)
  longitude = 122.9463,
  geofence_radius_meters = 150
WHERE latitude IS NULL;
