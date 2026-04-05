-- Admin login (AdminLogin.tsx) looks up profiles by mobile_number + user_type = 'admin'.
-- Step 1: promote any existing row with this number (any stored format).
UPDATE public.profiles
SET
  user_type = 'admin',
  updated_at = now()
WHERE mobile_number IN (
  '8515006429',
  '+918515006429',
  '918515006429'
);

-- Step 2: if no profile exists for this number, create an admin profile (mobile stored as 10 digits for login lookup).
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
