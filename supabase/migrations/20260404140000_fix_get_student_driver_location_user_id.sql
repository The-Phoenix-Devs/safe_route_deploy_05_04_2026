-- Driver app upserts live_locations.user_id with drivers.id (PK).
-- Legacy RPC joined only on d.profile_id = ll.user_id, so lat/lng were always NULL for most flows.
-- Match either auth profile id or driver row id so ETA + RPC fallback work.

CREATE OR REPLACE FUNCTION public.get_student_driver_location(student_id UUID)
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
    d.id AS driver_id,
    d.name AS driver_name,
    d.bus_number,
    ll.latitude,
    ll.longitude,
    ll.timestamp AS last_updated,
    ll.is_active
  FROM public.students s
  JOIN public.drivers d ON s.driver_id = d.id
  LEFT JOIN LATERAL (
    SELECT ll_inner.*
    FROM public.live_locations ll_inner
    WHERE ll_inner.user_type = 'driver'
      AND ll_inner.is_active = true
      AND (ll_inner.user_id = d.profile_id OR ll_inner.user_id = d.id)
    ORDER BY ll_inner.timestamp DESC NULLS LAST
    LIMIT 1
  ) ll ON true
  WHERE s.id = student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
