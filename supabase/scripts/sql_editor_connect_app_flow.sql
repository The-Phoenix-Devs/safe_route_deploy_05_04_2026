-- =============================================================================
-- Safe Route — run this in Supabase Dashboard → SQL Editor (one project = one DB)
-- =============================================================================
-- Prerequisites: your project already has tables profiles, drivers, students,
-- live_locations, routes, etc. from the repo migrations. This script does NOT
-- create the full schema; it fixes links needed for login + live tracking.
--
-- App connection (not “separate databases”):
--   Frontend .env → NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
--   All roles (admin / driver / guardian) hit the SAME Supabase project.
--
-- Flow (custom login — usually no Supabase Auth session):
--
--   Browser (anon JWT from publishable key)
--        │
--        ├─► profiles SELECT          → email/mobile login picks a row
--        ├─► verify_driver_qr_login  → driver QR → returns profile json
--        ├─► verify_guardian_admin_login → PIN flow
--        ├─► get_guardian_with_students(profile_id) → guardian’s students + driver
--        ├─► get_student_driver_location(student_id) → bus coords for ETA
--        └─► live_locations upsert   → needs UNIQUE(user_id) for ON CONFLICT
--
-- Data links:
--   profiles.id  = drivers.profile_id
--   students.driver_id → drivers.id
--   students.guardian_profile_id → profiles.id (guardian)
--   live_locations.user_id = drivers.id (driver app) OR profiles.id (some flows)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) live_locations: allow upsert ON CONFLICT (user_id)
-- -----------------------------------------------------------------------------
DELETE FROM public.live_locations
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id
        ORDER BY timestamp DESC NULLS LAST, created_at DESC NULLS LAST
      ) AS rn
    FROM public.live_locations
  ) ranked
  WHERE ranked.rn > 1
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.live_locations'::regclass
      AND conname = 'live_locations_user_id_unique'
  ) THEN
    ALTER TABLE public.live_locations
      ADD CONSTRAINT live_locations_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2) Join live bus row whether user_id is drivers.id or profiles.id (guardian ETA)
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 3) Let the mobile/web app (anon key) call SECURITY DEFINER RPCs used after login
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_guardian_with_students'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_guardian_with_students(uuid) TO anon, authenticated';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_student_driver_location'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_student_driver_location(uuid) TO anon, authenticated';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'verify_driver_qr_login'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.verify_driver_qr_login(uuid, text) TO anon, authenticated';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'verify_guardian_admin_login'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.verify_guardian_admin_login(text, text) TO anon, authenticated';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_admin_analytics'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_admin_analytics(text, uuid) TO anon, authenticated';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_today_holiday_status'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_today_holiday_status() TO anon, authenticated';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'admin_list_holidays'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.admin_list_holidays(uuid) TO anon, authenticated';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'admin_insert_holiday'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.admin_insert_holiday(uuid, text, text, date, date, boolean, boolean) TO anon, authenticated';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'admin_delete_holiday'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.admin_delete_holiday(uuid, uuid) TO anon, authenticated';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'create_admin_by_admin'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.create_admin_by_admin(uuid, text, text, text) TO anon, authenticated';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_admin_today_snapshot'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_admin_today_snapshot(uuid) TO anon, authenticated';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'driver_post_quick_status'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.driver_post_quick_status(uuid, text) TO anon, authenticated';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'admin_list_driver_quick_status'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.admin_list_driver_quick_status(uuid, int) TO anon, authenticated';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'upsert_guardian_push_token'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.upsert_guardian_push_token(uuid, text, text) TO anon, authenticated';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'delete_guardian_push_token'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.delete_guardian_push_token(uuid) TO anon, authenticated';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'driver_log_pickup_drop'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.driver_log_pickup_drop(uuid, uuid, text, text, text, double precision, double precision, text) TO anon, authenticated';
  END IF;
END $$;

-- =============================================================================
-- After running: Settings → API — copy Project URL + anon public key into .env
-- =============================================================================
