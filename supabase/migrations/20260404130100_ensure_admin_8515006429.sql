-- Idempotent: same logic as 20260404120000 — safe if that migration already ran without INSERT.
UPDATE public.profiles
SET
  user_type = 'admin',
  updated_at = now()
WHERE mobile_number IN (
  '8515006429',
  '+918515006429',
  '918515006429'
);

INSERT INTO public.profiles (
  firebase_uid,
  email,
  username,
  user_type,
  mobile_number,
  created_at,
  updated_at
)
SELECT
  'admin_firebase_8515006429',
  '8515006429.admin@sishutirtha.local',
  'Admin 8515006429',
  'admin',
  '8515006429',
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1
  FROM public.profiles p
  WHERE p.mobile_number IN (
    '8515006429',
    '+918515006429',
    '918515006429'
  )
);
