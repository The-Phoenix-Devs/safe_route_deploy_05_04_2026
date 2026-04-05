-- Fix analytics_summary foreign key relationships
-- Add proper foreign key constraints

-- First, add the foreign key constraint for route_id
ALTER TABLE analytics_summary 
ADD CONSTRAINT fk_analytics_route 
FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL;

-- Add the foreign key constraint for driver_id  
ALTER TABLE analytics_summary 
ADD CONSTRAINT fk_analytics_driver 
FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;