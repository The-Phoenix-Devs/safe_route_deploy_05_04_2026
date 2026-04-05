-- Aggregated admin analytics for dashboards. Uses SECURITY DEFINER so it works when
-- admins use custom login (localStorage profile) without Supabase Auth (auth.uid() is null).
-- Caller must pass a real admin profiles.id (validated inside the function).

CREATE OR REPLACE FUNCTION public.get_admin_analytics(
  p_range text DEFAULT 'month',
  p_admin_profile_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start timestamptz;
  v_prev_start timestamptz;
  v_span interval;
  v_trips int := 0;
  v_trips_prev int := 0;
  v_completed int := 0;
  v_completed_ot int := 0;
  v_on_time_pct numeric;
  v_students int := 0;
  v_panic int := 0;
  v_panic_prev int := 0;
  v_completed_prev int := 0;
  v_completed_ot_prev int := 0;
  v_on_time_prev numeric;
  v_monthly jsonb;
  v_weekly jsonb;
  v_routes jsonb;
  v_drivers jsonb;
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

  v_span := CASE lower(trim(coalesce(p_range, 'month')))
    WHEN 'week' THEN interval '7 days'
    WHEN 'quarter' THEN interval '90 days'
    ELSE interval '30 days'
  END;

  v_start := now() - v_span;
  v_prev_start := v_start - v_span;

  SELECT COUNT(*) INTO v_trips FROM public.trip_sessions WHERE start_time >= v_start;
  SELECT COUNT(*) INTO v_trips_prev
  FROM public.trip_sessions WHERE start_time >= v_prev_start AND start_time < v_start;

  SELECT COUNT(*) INTO v_completed FROM public.trip_sessions
  WHERE start_time >= v_start AND status = 'completed' AND end_time IS NOT NULL;

  SELECT COUNT(*) INTO v_completed_ot FROM public.trip_sessions
  WHERE start_time >= v_start AND status = 'completed' AND end_time IS NOT NULL
    AND end_time <= start_time + interval '12 hours';

  v_on_time_pct := CASE WHEN v_completed > 0
    THEN ROUND(100.0 * v_completed_ot / v_completed, 1)
    ELSE NULL END;

  SELECT COUNT(*) INTO v_completed_prev FROM public.trip_sessions
  WHERE start_time >= v_prev_start AND start_time < v_start
    AND status = 'completed' AND end_time IS NOT NULL;

  SELECT COUNT(*) INTO v_completed_ot_prev FROM public.trip_sessions
  WHERE start_time >= v_prev_start AND start_time < v_start
    AND status = 'completed' AND end_time IS NOT NULL
    AND end_time <= start_time + interval '12 hours';

  v_on_time_prev := CASE WHEN v_completed_prev > 0
    THEN ROUND(100.0 * v_completed_ot_prev / v_completed_prev, 1)
    ELSE NULL END;

  SELECT COUNT(*) INTO v_students FROM public.students;

  SELECT COUNT(*) INTO v_panic FROM public.panic_alerts WHERE created_at >= v_start;
  SELECT COUNT(*) INTO v_panic_prev
  FROM public.panic_alerts WHERE created_at >= v_prev_start AND created_at < v_start;

  SELECT COALESCE(jsonb_agg(obj ORDER BY m), '[]'::jsonb) INTO v_monthly
  FROM (
    SELECT jsonb_build_object(
      'month', to_char(m, 'Mon'),
      'trips', (
        SELECT COUNT(*)::int FROM public.trip_sessions ts
        WHERE ts.start_time >= date_trunc('month', m::timestamptz)
          AND ts.start_time < date_trunc('month', m::timestamptz) + interval '1 month'
      ),
      'onTime', COALESCE((
        SELECT ROUND(100.0 * COUNT(*) FILTER (
          WHERE ts2.status = 'completed' AND ts2.end_time IS NOT NULL
            AND ts2.end_time <= ts2.start_time + interval '12 hours'
        ) / NULLIF(COUNT(*) FILTER (
          WHERE ts2.status = 'completed' AND ts2.end_time IS NOT NULL), 0), 0)
        FROM public.trip_sessions ts2
        WHERE ts2.start_time >= date_trunc('month', m::timestamptz)
          AND ts2.start_time < date_trunc('month', m::timestamptz) + interval '1 month'
      ), 0),
      'fuel', 0
    ) AS obj,
    m
    FROM generate_series(
      date_trunc('month', now() AT TIME ZONE 'utc') - interval '5 months',
      date_trunc('month', now() AT TIME ZONE 'utc'),
      interval '1 month'
    ) AS m
  ) s;

  SELECT COALESCE(jsonb_agg(obj ORDER BY sort_key), '[]'::jsonb) INTO v_weekly
  FROM (
    SELECT
      gs.d AS sort_key,
      jsonb_build_object(
        'day', trim(to_char(gs.d::timestamp, 'Dy')),
        'pickup', (
          SELECT COUNT(*)::int FROM public.pickup_drop_history pd
          WHERE pd.event_type = 'pickup' AND (pd.event_time AT TIME ZONE 'utc')::date = gs.d
        ),
        'dropoff', (
          SELECT COUNT(*)::int FROM public.pickup_drop_history pd
          WHERE pd.event_type = 'drop' AND (pd.event_time AT TIME ZONE 'utc')::date = gs.d
        ),
        'incidents', (
          SELECT COUNT(*)::int FROM public.panic_alerts pa
          WHERE (pa.created_at AT TIME ZONE 'utc')::date = gs.d
        )
      ) AS obj
    FROM generate_series(
      (CURRENT_DATE - 6)::date,
      CURRENT_DATE::date,
      interval '1 day'
    ) AS gs(d)
  ) w;

  SELECT COALESCE(jsonb_agg(obj), '[]'::jsonb) INTO v_routes
  FROM (
    SELECT jsonb_build_object(
      'route', r.name,
      'onTime', COALESCE((
        SELECT LEAST(100, GREATEST(0, ROUND(100.0 * COUNT(*) FILTER (
          WHERE ts.status = 'completed' AND ts.end_time IS NOT NULL
            AND ts.end_time <= ts.start_time + interval '12 hours'
        ) / NULLIF(COUNT(*) FILTER (
          WHERE ts.status = 'completed' AND ts.end_time IS NOT NULL), 0), 0)))::int
        FROM public.trip_sessions ts
        JOIN public.drivers drv ON drv.id = ts.driver_id
        WHERE drv.route_id = r.id AND ts.start_time >= v_start
      ), 0),
      'avgDelay', 0,
      'students', (
        SELECT COUNT(*)::int FROM public.students s
        JOIN public.drivers drv ON drv.id = s.driver_id
        WHERE drv.route_id = r.id
      )
    ) AS obj
    FROM public.routes r
  ) x;

  SELECT COALESCE(jsonb_agg(obj), '[]'::jsonb) INTO v_drivers
  FROM (
    SELECT jsonb_build_object(
      'name', q.name,
      'rating', ROUND(LEAST(5.0, GREATEST(3.5, 4.0 + (COALESCE(q.ot, 0)::numeric / 100.0)))::numeric, 1),
      'trips', q.cnt,
      'onTime', COALESCE(q.ot, 0)
    ) AS obj
    FROM (
      SELECT
        d.name,
        COUNT(ts.id) AS cnt,
        ROUND(100.0 * COUNT(*) FILTER (
          WHERE ts.status = 'completed' AND ts.end_time IS NOT NULL
            AND ts.end_time <= ts.start_time + interval '12 hours'
        ) / NULLIF(COUNT(*) FILTER (
          WHERE ts.status = 'completed' AND ts.end_time IS NOT NULL), 0), 0)::int AS ot
      FROM public.drivers d
      INNER JOIN public.trip_sessions ts ON ts.driver_id = d.id AND ts.start_time >= v_start
      GROUP BY d.id, d.name
      ORDER BY COUNT(ts.id) DESC
      LIMIT 15
    ) q
  ) z;

  RETURN jsonb_build_object(
    'kpis', jsonb_build_object(
      'totalTrips', v_trips,
      'totalTripsPrev', v_trips_prev,
      'onTimePercentage', v_on_time_pct,
      'onTimePercentagePrev', v_on_time_prev,
      'totalStudents', v_students,
      'safetyIncidents', v_panic,
      'safetyIncidentsPrev', v_panic_prev,
      'activeDriversInPeriod', (
        SELECT COUNT(DISTINCT driver_id)::int FROM public.trip_sessions WHERE start_time >= v_start
      )
    ),
    'monthlyTrends', v_monthly,
    'weeklyStats', v_weekly,
    'routePerformance', v_routes,
    'driverPerformance', v_drivers
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_analytics(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_analytics(text, uuid) TO anon, authenticated;
