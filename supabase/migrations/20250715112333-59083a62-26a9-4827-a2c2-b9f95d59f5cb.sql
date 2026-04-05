-- Create user_logs table for tracking user login activity
CREATE TABLE IF NOT EXISTS public.user_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'driver', 'guardian')),
  user_name TEXT NOT NULL,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  location TEXT,
  ip_address TEXT,
  device_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view all user logs
CREATE POLICY "Admins can view all user logs" 
ON public.user_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_type = 'admin'
  )
);

-- Create policy for system to insert user logs
CREATE POLICY "System can insert user logs" 
ON public.user_logs 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_user_logs_user_type ON public.user_logs(user_type);
CREATE INDEX idx_user_logs_login_time ON public.user_logs(login_time DESC);
CREATE INDEX idx_user_logs_user_id ON public.user_logs(user_id);