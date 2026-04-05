-- 1. Create proper role-based security functions
CREATE OR REPLACE FUNCTION public.get_current_user_type()
RETURNS TEXT AS $$
  SELECT user_type FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_driver()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'driver'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_guardian()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'guardian'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 2. Drop overly permissive policies and create secure ones

-- PROFILES TABLE SECURITY
DROP POLICY IF EXISTS "Allow authenticated users to manage profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (public.is_admin());

CREATE POLICY "System can insert profiles" 
ON public.profiles FOR INSERT 
WITH CHECK (true);

-- STUDENTS TABLE SECURITY
DROP POLICY IF EXISTS "Allow authenticated users to manage students" ON public.students;

CREATE POLICY "Admins can manage all students" 
ON public.students FOR ALL 
USING (public.is_admin());

CREATE POLICY "Guardians can view their own students" 
ON public.students FOR SELECT 
USING (guardian_profile_id = auth.uid());

CREATE POLICY "Drivers can view their assigned students" 
ON public.students FOR SELECT 
USING (driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid()));

-- DRIVERS TABLE SECURITY
DROP POLICY IF EXISTS "Allow authenticated users to manage drivers" ON public.drivers;

CREATE POLICY "Admins can manage all drivers" 
ON public.drivers FOR ALL 
USING (public.is_admin());

CREATE POLICY "Drivers can view their own data" 
ON public.drivers FOR SELECT 
USING (profile_id = auth.uid());

CREATE POLICY "Drivers can update their own data" 
ON public.drivers FOR UPDATE 
USING (profile_id = auth.uid());

-- ROUTES TABLE SECURITY
DROP POLICY IF EXISTS "Allow authenticated users to manage routes" ON public.routes;

CREATE POLICY "Admins can manage all routes" 
ON public.routes FOR ALL 
USING (public.is_admin());

CREATE POLICY "Authenticated users can view routes" 
ON public.routes FOR SELECT 
USING (auth.role() = 'authenticated');

-- TRIP SESSIONS SECURITY
DROP POLICY IF EXISTS "Allow authenticated users to manage trip sessions" ON public.trip_sessions;

CREATE POLICY "Admins can manage all trip sessions" 
ON public.trip_sessions FOR ALL 
USING (public.is_admin());

CREATE POLICY "Drivers can manage their own trip sessions" 
ON public.trip_sessions FOR ALL 
USING (driver_id IN (SELECT id FROM drivers WHERE profile_id = auth.uid()));

-- 3. Add audit logging for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security logs" 
ON public.security_audit_log FOR SELECT 
USING (public.is_admin());

CREATE POLICY "System can insert security logs" 
ON public.security_audit_log FOR INSERT 
WITH CHECK (true);

-- 4. Create function to log sensitive operations
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action text,
  p_table_name text,
  p_record_id uuid DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, action, table_name, record_id, old_values, new_values
  ) VALUES (
    auth.uid(), p_action, p_table_name, p_record_id, p_old_values, p_new_values
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;