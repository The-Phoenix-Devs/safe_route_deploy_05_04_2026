-- Create route deviations table for tracking when drivers go off route
CREATE TABLE public.route_deviations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  route_id UUID,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  deviation_distance DOUBLE PRECISION NOT NULL, -- distance in meters from route
  deviation_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  severity TEXT NOT NULL DEFAULT 'minor', -- minor, major, critical
  reason TEXT, -- Optional explanation from driver
  auto_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.route_deviations ENABLE ROW LEVEL SECURITY;

-- Create policies for route deviations
CREATE POLICY "Drivers can view their own route deviations" 
ON public.route_deviations 
FOR SELECT 
USING (driver_id IN (
  SELECT d.id FROM drivers d WHERE d.profile_id = auth.uid()
));

CREATE POLICY "System can insert route deviations" 
ON public.route_deviations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Drivers can update their route deviations" 
ON public.route_deviations 
FOR UPDATE 
USING (driver_id IN (
  SELECT d.id FROM drivers d WHERE d.profile_id = auth.uid()
))
WITH CHECK (driver_id IN (
  SELECT d.id FROM drivers d WHERE d.profile_id = auth.uid()
));

CREATE POLICY "Admins can view and manage all route deviations" 
ON public.route_deviations 
FOR ALL 
USING (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_route_deviations_updated_at
BEFORE UPDATE ON public.route_deviations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();