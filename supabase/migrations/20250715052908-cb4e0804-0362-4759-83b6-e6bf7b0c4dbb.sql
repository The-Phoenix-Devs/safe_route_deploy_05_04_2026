-- Create guardian profiles and link to students
-- Add missing foreign key relationship between students and guardian profiles

-- First, ensure all students have proper guardian_profile_id links
-- We'll add a trigger to automatically create guardian profiles when students are added

-- Update the students table to ensure guardian information is properly structured
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS pickup_location_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS pickup_location_lng DECIMAL(11, 8);

-- Create a function to get guardian details for students
CREATE OR REPLACE FUNCTION get_guardian_with_students(guardian_profile_id UUID)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  grade TEXT,
  pickup_point TEXT,
  pickup_location_lat DECIMAL,
  pickup_location_lng DECIMAL,
  bus_number TEXT,
  driver_id UUID,
  driver_name TEXT,
  driver_mobile TEXT,
  route_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as student_id,
    s.name as student_name,
    s.grade,
    s.pickup_point,
    s.pickup_location_lat,
    s.pickup_location_lng,
    s.bus_number,
    s.driver_id,
    d.name as driver_name,
    d.mobile_number as driver_mobile,
    r.name as route_name
  FROM public.students s
  LEFT JOIN public.drivers d ON s.driver_id = d.id
  LEFT JOIN public.routes r ON d.route_id = r.id
  WHERE s.guardian_profile_id = guardian_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get active driver location for student
CREATE OR REPLACE FUNCTION get_student_driver_location(student_id UUID)
RETURNS TABLE (
  driver_id UUID,
  driver_name TEXT,
  bus_number TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  last_updated TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id as driver_id,
    d.name as driver_name,
    d.bus_number,
    ll.latitude,
    ll.longitude,
    ll.timestamp as last_updated,
    ll.is_active
  FROM public.students s
  JOIN public.drivers d ON s.driver_id = d.id
  LEFT JOIN public.live_locations ll ON d.profile_id = ll.user_id 
    AND ll.user_type = 'driver' 
    AND ll.is_active = true
  WHERE s.id = student_id
  ORDER BY ll.timestamp DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;