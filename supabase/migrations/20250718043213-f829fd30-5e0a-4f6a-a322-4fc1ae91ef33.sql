-- Create a policy to allow login access to profiles
-- This allows anyone to read profiles for authentication purposes only
CREATE POLICY "Allow login access to profiles" 
ON public.profiles 
FOR SELECT 
TO anon
USING (true);