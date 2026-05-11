-- Add geofence_enabled toggle to restaurants table
ALTER TABLE restaurants
  ADD COLUMN geofence_enabled BOOLEAN DEFAULT false;

-- If coordinates exist, we can optionally default it to true, 
-- but for safety as requested, we'll keep it false by default.
