-- Portal login: 6-digit PIN stored as bcrypt hash (pgcrypto). Mobile last-10 digits match profiles.mobile_number.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS portal_pin_hash text;

COMMENT ON COLUMN public.profiles.portal_pin_hash IS 'bcrypt hash of 6-digit portal PIN (guardian/driver). Set via init_portal_pin_for_profile.';

CREATE OR REPLACE FUNCTION public.last10_digits(p_input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT CASE
    WHEN length(regexp_replace(COALESCE(p_input, ''), '\D', '', 'g')) >= 10
    THEN right(regexp_replace(COALESCE(p_input, ''), '\D', '', 'g'), 10)
    ELSE NULL
  END;
$$;

-- First-time PIN set after profile insert (anon). Restricted: mobile must match, hash unset, recent row, guardian/driver only.
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
  SET portal_pin_hash = crypt(p_plain_pin, gen_salt('bf', 8))
  WHERE p.id = p_profile_id
    AND p.portal_pin_hash IS NULL
    AND p.user_type IN ('guardian', 'driver')
    AND public.last10_digits(p.mobile_number) = v10
    AND p.created_at > now() - interval '30 minutes';

  GET DIAGNOSTICS updated = ROW_COUNT;
  RETURN updated > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.init_portal_pin_for_profile(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.init_portal_pin_for_profile(uuid, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.init_portal_pin_for_profile(uuid, text, text) TO authenticated;

-- Manual login: mobile + 6-digit PIN for guardian or driver.
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

REVOKE ALL ON FUNCTION public.verify_portal_pin_login(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_portal_pin_login(text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_portal_pin_login(text, text, text) TO authenticated;
