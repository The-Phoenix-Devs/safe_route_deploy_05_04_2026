-- Secure driver login via QR: validates driver id + qr_token server-side without exposing driver rows to broad SELECT patterns.
CREATE OR REPLACE FUNCTION public.verify_driver_qr_login(p_driver_id uuid, p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  IF p_driver_id IS NULL OR p_token IS NULL OR length(trim(p_token)) < 32 THEN
    RETURN NULL;
  END IF;

  SELECT json_build_object(
    'id', p.id,
    'email', COALESCE(p.email, ''),
    'username', p.username,
    'mobile_number', p.mobile_number,
    'user_type', p.user_type
  ) INTO result
  FROM public.drivers d
  INNER JOIN public.profiles p ON p.id = d.profile_id
  WHERE d.id = p_driver_id
    AND d.qr_token IS NOT NULL
    AND d.qr_token = p_token
    AND p.user_type = 'driver';

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_driver_qr_login(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_driver_qr_login(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_driver_qr_login(uuid, text) TO authenticated;
