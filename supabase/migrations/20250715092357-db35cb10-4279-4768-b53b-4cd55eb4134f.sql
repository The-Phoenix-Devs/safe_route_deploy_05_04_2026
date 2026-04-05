-- Insert admin profile into Supabase
INSERT INTO public.profiles (
  id,
  firebase_uid,
  email,
  username,
  user_type,
  mobile_number,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin-firebase-uid-placeholder',
  'subhankar.ghorui1995@gmail.com',
  'admin',
  'admin',
  NULL,
  now(),
  now()
) ON CONFLICT (firebase_uid) DO NOTHING;