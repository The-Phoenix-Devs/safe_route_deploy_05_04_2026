-- Update the existing admin profile to use the correct email
UPDATE public.profiles 
SET 
  email = 'subhankar.ghorui1995@gmail.com',
  updated_at = now()
WHERE user_type = 'admin' AND username = 'admin';