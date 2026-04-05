-- Parent / guardian coordinator role: 6-digit PIN + mobile (separate from full school admin).
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS coordination_pin TEXT;

COMMENT ON COLUMN public.profiles.coordination_pin IS '6-digit PIN for user_type guardian_admin only; rotate from admin panel when needed.';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_user_type_check
CHECK (user_type IN ('admin', 'driver', 'guardian', 'guardian_admin'));

CREATE OR REPLACE FUNCTION public.verify_guardian_admin_login(p_mobile text, p_pin text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  norm text;
BEGIN
  IF p_pin IS NULL OR p_pin !~ '^\d{6}$' THEN
    RETURN NULL;
  END IF;

  norm := right(regexp_replace(COALESCE(p_mobile, ''), '\D', '', 'g'), 10);
  IF length(norm) <> 10 THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'id', p.id,
    'email', COALESCE(p.email, ''),
    'username', p.username,
    'mobile_number', p.mobile_number,
    'user_type', 'guardian_admin'
  ) INTO result
  FROM public.profiles p
  WHERE p.user_type = 'guardian_admin'
    AND p.coordination_pin = p_pin
    AND right(regexp_replace(COALESCE(p.mobile_number, ''), '\D', '', 'g'), 10) = norm
  LIMIT 1;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_guardian_admin_login(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_guardian_admin_login(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_guardian_admin_login(text, text) TO authenticated;

ALTER TABLE public.user_logs DROP CONSTRAINT IF EXISTS user_logs_user_type_check;
ALTER TABLE public.user_logs
ADD CONSTRAINT user_logs_user_type_check
CHECK (user_type IN ('admin', 'driver', 'guardian', 'guardian_admin'));
