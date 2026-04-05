-- Custom app login uses anon JWT (no auth.uid()). Direct INSERT into pickup_drop_history
-- fails RLS. This RPC validates student↔driver and inserts as SECURITY DEFINER.

CREATE OR REPLACE FUNCTION public.driver_log_pickup_drop(
  p_student_id uuid,
  p_driver_id uuid,
  p_event_type text,
  p_bus_number text DEFAULT NULL,
  p_location_name text DEFAULT NULL,
  p_location_lat double precision DEFAULT NULL,
  p_location_lng double precision DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF p_student_id IS NULL OR p_driver_id IS NULL OR p_event_type IS NULL THEN
    RAISE EXCEPTION 'missing required fields';
  END IF;

  IF p_event_type NOT IN ('pickup', 'drop') THEN
    RAISE EXCEPTION 'invalid event_type';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = p_student_id AND s.driver_id = p_driver_id
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.pickup_drop_history (
    student_id,
    driver_id,
    event_type,
    event_time,
    location_lat,
    location_lng,
    location_name,
    bus_number,
    notes
  )
  VALUES (
    p_student_id,
    p_driver_id,
    p_event_type,
    now(),
    CASE WHEN p_location_lat IS NOT NULL THEN p_location_lat::numeric ELSE NULL END,
    CASE WHEN p_location_lng IS NOT NULL THEN p_location_lng::numeric ELSE NULL END,
    p_location_name,
    p_bus_number,
    p_notes
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.driver_log_pickup_drop(
  uuid, uuid, text, text, text, double precision, double precision, text
) TO anon;

GRANT EXECUTE ON FUNCTION public.driver_log_pickup_drop(
  uuid, uuid, text, text, text, double precision, double precision, text
) TO authenticated;
