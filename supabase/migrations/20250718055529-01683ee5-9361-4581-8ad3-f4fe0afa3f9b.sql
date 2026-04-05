-- Create panic alerts table for emergency situations
CREATE TABLE public.panic_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  alert_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active',
  resolved_time TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.panic_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for panic alerts
CREATE POLICY "Drivers can create their own panic alerts" 
ON public.panic_alerts 
FOR INSERT 
WITH CHECK (driver_id IN (
  SELECT d.id FROM drivers d WHERE d.profile_id = auth.uid()
));

CREATE POLICY "Drivers can view their own panic alerts" 
ON public.panic_alerts 
FOR SELECT 
USING (driver_id IN (
  SELECT d.id FROM drivers d WHERE d.profile_id = auth.uid()
));

CREATE POLICY "Admins can view and manage all panic alerts" 
ON public.panic_alerts 
FOR ALL 
USING (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_panic_alerts_updated_at
BEFORE UPDATE ON public.panic_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();