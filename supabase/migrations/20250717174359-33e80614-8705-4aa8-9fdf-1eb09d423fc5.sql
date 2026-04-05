-- Update the student record with sample pickup coordinates (Basantabati area coordinates)
-- This is for demonstration - in production, admin should set these via the admin panel

UPDATE students 
SET 
  pickup_location_lat = 22.7926,  -- Sample latitude for Basantabati area
  pickup_location_lng = 87.7795   -- Sample longitude for Basantabati area
WHERE name = 'Sayan Patra' AND pickup_point = 'Basantabati' AND pickup_location_lat IS NULL;

-- Create an index for better performance on location queries
CREATE INDEX IF NOT EXISTS idx_students_pickup_location ON students(pickup_location_lat, pickup_location_lng) WHERE pickup_location_lat IS NOT NULL AND pickup_location_lng IS NOT NULL;

-- Add a database function to help admins identify students without pickup coordinates
CREATE OR REPLACE FUNCTION get_students_missing_coordinates()
RETURNS TABLE(
    student_id uuid,
    student_name text,
    pickup_point text,
    guardian_name text,
    guardian_mobile text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.pickup_point,
        s.guardian_name,
        s.guardian_mobile
    FROM students s
    WHERE s.pickup_location_lat IS NULL OR s.pickup_location_lng IS NULL
    ORDER BY s.name;
END;
$$;