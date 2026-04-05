-- Fix: gen_salt/crypt must resolve to pgcrypto (typically in schema "extensions" on Supabase).
-- Also store a short-lived plaintext PIN for admin WhatsApp resend only (same row as hash).

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS portal_pin_plain_temp text;

COMMENT ON COLUMN public.profiles.portal_pin_plain_temp IS 'Last issued 6-digit PIN for admin WhatsApp resend; keep private. Cleared when rotated.';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_portal_pin_plain_temp_unique
  ON public.profiles (portal_pin_plain_temp)
  WHERE portal_pin_plain_temp IS NOT NULL;

-- True if no other profile is using this plaintext temp (uniqueness for issuance).
CREATE OR REPLACE FUNCTION public.portal_pin_plain_available(p_plain text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.portal_pin_plain_temp IS NOT NULL
      AND p.portal_pin_plain_temp = p_plain
  );
$$;

REVOKE ALL ON FUNCTION public.portal_pin_plain_available(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.portal_pin_plain_available(text) TO anon;
GRANT EXECUTE ON FUNCTION public.portal_pin_plain_available(text) TO authenticated;

-- Fetch stored PIN for WhatsApp resend (mobile last-10 must match profile).
CREATE OR REPLACE FUNCTION public.get_portal_pin_for_resend(
  p_profile_id uuid,
  p_mobile_last10 text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v10 text;
  v text;
BEGIN
  IF p_profile_id IS NULL OR p_mobile_last10 IS NULL THEN
    RETURN NULL;
  END IF;

  v10 := right(regexp_replace(p_mobile_last10, '\D', '', 'g'), 10);
  IF length(v10) <> 10 THEN
    RETURN NULL;
  END IF;

  SELECT portal_pin_plain_temp INTO v
  FROM public.profiles
  WHERE id = p_profile_id
    AND public.last10_digits(mobile_number) = v10
    AND user_type IN ('guardian', 'driver');

  RETURN v;
END;
$$;

REVOKE ALL ON FUNCTION public.get_portal_pin_for_resend(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_portal_pin_for_resend(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_portal_pin_for_resend(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.init_portal_pin_for_profile(
  p_profile_id uuid,
  p_mobile text,
  p_plain_pin text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v10 text;
  updated int;
BEGIN
  IF p_profile_id IS NULL OR p_mobile IS NULL OR p_plain_pin IS NULL THEN
    RETURN false;
  END IF;
  IF p_plain_pin !~ '^\d{6}$' THEN
    RAISE EXCEPTION 'PIN must be exactly 6 digits';
  END IF;

  v10 := public.last10_digits(p_mobile);
  IF v10 IS NULL OR length(v10) <> 10 THEN
    RETURN false;
  END IF;

  UPDATE public.profiles p
  SET
    portal_pin_hash = crypt(p_plain_pin, gen_salt('bf', 8)),
    portal_pin_plain_temp = p_plain_pin
  WHERE p.id = p_profile_id
    AND p.portal_pin_hash IS NULL
    AND p.user_type IN ('guardian', 'driver')
    AND public.last10_digits(p.mobile_number) = v10
    AND p.created_at > now() - interval '30 minutes';

  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_portal_pin_login(
  p_mobile text,
  p_pin text,
  p_user_type text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v10 text;
  p public.profiles%ROWTYPE;
BEGIN
  IF p_mobile IS NULL OR p_pin IS NULL OR p_user_type IS NULL THEN
    RETURN NULL;
  END IF;
  IF p_user_type NOT IN ('guardian', 'driver') THEN
    RETURN NULL;
  END IF;
  IF p_pin !~ '^\d{6}$' THEN
    RETURN NULL;
  END IF;

  v10 := public.last10_digits(p_mobile);
  IF v10 IS NULL OR length(v10) <> 10 THEN
    RETURN NULL;
  END IF;

  SELECT * INTO p
  FROM public.profiles pr
  WHERE pr.user_type = p_user_type
    AND public.last10_digits(pr.mobile_number) = v10
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF p.portal_pin_hash IS NULL THEN
    RETURN json_build_object('error', 'no_pin_set');
  END IF;

  IF crypt(p_pin, p.portal_pin_hash) <> p.portal_pin_hash THEN
    RETURN NULL;
  END IF;

  RETURN json_build_object(
    'id', p.id,
    'email', COALESCE(p.email, ''),
    'username', p.username,
    'mobile_number', p.mobile_number,
    'user_type', p.user_type
  );
END;
$$;
