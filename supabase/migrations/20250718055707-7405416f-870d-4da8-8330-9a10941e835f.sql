-- Create speed monitoring table for tracking speed violations
CREATE TABLE public.speed_violations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  speed_recorded DOUBLE PRECISION NOT NULL,
  speed_limit DOUBLE PRECISION NOT NULL,
  violation_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  severity TEXT NOT NULL DEFAULT 'warning', -- warning, minor, major
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.speed_violations ENABLE ROW LEVEL SECURITY;

-- Create policies for speed violations
CREATE POLICY "Drivers can view their own speed violations" 
ON public.speed_violations 
FOR SELECT 
USING (driver_id IN (
  SELECT d.id FROM drivers d WHERE d.profile_id = auth.uid()
));

CREATE POLICY "System can insert speed violations" 
ON public.speed_violations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Drivers can acknowledge their speed violations" 
ON public.speed_violations 
FOR UPDATE 
USING (driver_id IN (
  SELECT d.id FROM drivers d WHERE d.profile_id = auth.uid()
))
WITH CHECK (driver_id IN (
  SELECT d.id FROM drivers d WHERE d.profile_id = auth.uid()
));

CREATE POLICY "Admins can view and manage all speed violations" 
ON public.speed_violations 
FOR ALL 
USING (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_speed_violations_updated_at
BEFORE UPDATE ON public.speed_violations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();