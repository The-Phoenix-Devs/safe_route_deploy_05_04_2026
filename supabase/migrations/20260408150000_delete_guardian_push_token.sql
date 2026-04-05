-- Allow guardians to clear stored web push token on logout (SECURITY DEFINER; RLS has no direct DELETE).

CREATE OR REPLACE FUNCTION public.delete_guardian_push_token(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_profile_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_profile_id AND user_type = 'guardian'
  ) THEN
    RETURN;
  END IF;

  DELETE FROM public.guardian_push_tokens WHERE profile_id = p_profile_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_guardian_push_token(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_guardian_push_token(uuid) TO authenticated;
