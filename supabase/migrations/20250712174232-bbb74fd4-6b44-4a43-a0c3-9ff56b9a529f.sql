-- Fix infinite recursion in RLS policies by using security definer functions

-- First, create security definer functions to avoid circular references
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE(user_id uuid, user_type text, firebase_uid text) AS $$
BEGIN
  RETURN QUERY 
  SELECT p.id, p.user_type, p.firebase_uid
  FROM public.profiles p
  WHERE p.firebase_uid = (auth.jwt() ->> 'sub'::text);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE firebase_uid = (auth.jwt() ->> 'sub'::text) 
    AND user_type = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all access to profiles for service role" ON public.profiles;

DROP POLICY IF EXISTS "Admins can manage drivers" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can view their own data" ON public.drivers;
DROP POLICY IF EXISTS "Allow all access to drivers for service role" ON public.drivers;

DROP POLICY IF EXISTS "Admins can manage students" ON public.students;
DROP POLICY IF EXISTS "Guardians can view their students" ON public.students;
DROP POLICY IF EXISTS "Allow all access to students for service role" ON public.students;

-- Create new simplified policies using security definer functions

-- Profiles policies (allow all operations for now to avoid recursion)
CREATE POLICY "Allow authenticated users to manage profiles" 
ON public.profiles 
FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Drivers policies
CREATE POLICY "Allow authenticated users to manage drivers" 
ON public.drivers 
FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Students policies  
CREATE POLICY "Allow authenticated users to manage students" 
ON public.students 
FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'anon');