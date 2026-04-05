-- One-glance "today" stats for admin dashboards (custom login safe).

CREATE OR REPLACE FUNCTION public.get_admin_today_snapshot(p_admin_profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ist date;
  v_start timestamptz;
  v_end timestamptz;
  v_active int := 0;
  v_started_today int := 0;
  v_completed_today int := 0;
  v_open_feedback int := 0;
  v_live_drivers int := 0;
BEGIN
  IF p_admin_profile_id IS NULL THEN
    RAISE EXCEPTION 'admin profile id required' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_admin_profile_id AND user_type IN ('admin', 'guardian_admin')
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  v_ist := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date;
  v_start := v_ist::timestamp AT TIME ZONE 'Asia/Kolkata';
  v_end := (v_ist + 1)::timestamp AT TIME ZONE 'Asia/Kolkata';

  SELECT COUNT(*)::int INTO v_active
  FROM public.trip_sessions
  WHERE status = 'active';

  SELECT COUNT(*)::int INTO v_started_today
  FROM public.trip_sessions
  WHERE start_time >= v_start AND start_time < v_end;

  SELECT COUNT(*)::int INTO v_completed_today
  FROM public.trip_sessions
  WHERE status = 'completed'
    AND COALESCE(end_time, start_time) >= v_start
    AND COALESCE(end_time, start_time) < v_end;

  SELECT COUNT(*)::int INTO v_open_feedback
  FROM public.parent_feedback
  WHERE status IN ('open', 'in_progress');

  SELECT COUNT(*)::int INTO v_live_drivers
  FROM public.live_locations
  WHERE is_active = true AND user_type = 'driver';

  RETURN jsonb_build_object(
    'date_ist', v_ist::text,
    'active_trips', v_active,
    'trips_started_today', v_started_today,
    'trips_completed_today', v_completed_today,
    'open_feedback', v_open_feedback,
    'live_drivers', v_live_drivers
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_today_snapshot(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_admin_today_snapshot(uuid) TO authenticated;
