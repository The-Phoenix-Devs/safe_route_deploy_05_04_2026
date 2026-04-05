-- Guardian FCM device tokens (for bulk / trip pushes from your Edge Functions)
-- + optional activity_type on user_logs for guardian “steps”.

ALTER TABLE public.user_logs
  ADD COLUMN IF NOT EXISTS activity_type text NOT NULL DEFAULT 'login';

COMMENT ON COLUMN public.user_logs.activity_type IS 'login | app_open | session_active | map_view | feedback | push_register | ...';

CREATE TABLE IF NOT EXISTS public.guardian_push_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL DEFAULT 'web',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT guardian_push_tokens_profile_unique UNIQUE (profile_id)
);

CREATE INDEX IF NOT EXISTS idx_guardian_push_tokens_updated ON public.guardian_push_tokens (updated_at DESC);

ALTER TABLE public.guardian_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.upsert_guardian_push_token(
  p_profile_id uuid,
  p_token text,
  p_platform text DEFAULT 'web'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t text := trim(both from coalesce(p_token, ''));
  plat text := trim(both from coalesce(nullif(p_platform, ''), 'web'));
BEGIN
  IF p_profile_id IS NULL THEN
    RAISE EXCEPTION 'profile required';
  END IF;

  IF length(t) < 10 THEN
    RAISE EXCEPTION 'invalid token';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_profile_id AND user_type = 'guardian'
  ) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.guardian_push_tokens (profile_id, token, platform, updated_at)
  VALUES (p_profile_id, t, plat, now())
  ON CONFLICT (profile_id) DO UPDATE
  SET token = EXCLUDED.token,
      platform = EXCLUDED.platform,
      updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_guardian_push_token(uuid, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_guardian_push_token(uuid, text, text) TO authenticated;
