-- Fix the get_guardian_with_students function to resolve column ambiguity
DROP FUNCTION IF EXISTS public.get_guardian_with_students(uuid);

CREATE OR REPLACE FUNCTION public.get_guardian_with_students(guardian_profile_id uuid)
 RETURNS TABLE(student_id uuid, student_name text, grade text, pickup_point text, pickup_location_lat numeric, pickup_location_lng numeric, bus_number text, driver_id uuid, driver_name text, driver_mobile text, route_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
  WHERE s.guardian_profile_id = get_guardian_with_students.guardian_profile_id;
END;
$function$;