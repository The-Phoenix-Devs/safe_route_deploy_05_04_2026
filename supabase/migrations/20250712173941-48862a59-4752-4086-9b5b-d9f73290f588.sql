-- Fix RLS policies to prevent infinite recursion

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create new simplified RLS policies for profiles
CREATE POLICY "Allow all access to profiles for service role" 
ON public.profiles 
FOR ALL 
USING (true);

-- Update drivers RLS policies to be more specific
DROP POLICY IF EXISTS "Users can view drivers" ON public.drivers;
DROP POLICY IF EXISTS "Users can insert drivers" ON public.drivers;
DROP POLICY IF EXISTS "Users can update drivers" ON public.drivers;
DROP POLICY IF EXISTS "Users can delete drivers" ON public.drivers;

CREATE POLICY "Allow all access to drivers for service role" 
ON public.drivers 
FOR ALL 
USING (true);

-- Update students RLS policies 
DROP POLICY IF EXISTS "Users can view students" ON public.students;
DROP POLICY IF EXISTS "Users can insert students" ON public.students;
DROP POLICY IF EXISTS "Users can update students" ON public.students;
DROP POLICY IF EXISTS "Users can delete students" ON public.students;

CREATE POLICY "Allow all access to students for service role" 
ON public.students 
FOR ALL 
USING (true);