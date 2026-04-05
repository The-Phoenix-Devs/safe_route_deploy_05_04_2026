-- Create notification logs table for tracking sent notifications
CREATE TABLE public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  user_type TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tokens_sent INTEGER DEFAULT 0,
  fcm_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow admins to view all notification logs" 
ON public.notification_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_type = 'admin'
  )
);

CREATE POLICY "Allow system to insert notification logs" 
ON public.notification_logs 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_notification_logs_updated_at
BEFORE UPDATE ON public.notification_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();