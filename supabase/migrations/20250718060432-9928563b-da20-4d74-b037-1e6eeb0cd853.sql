-- Create weather alerts table for tracking weather-based route adjustments
CREATE TABLE public.weather_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  route_id UUID,
  weather_condition TEXT NOT NULL, -- rain, storm, fog, snow, etc.
  severity TEXT NOT NULL DEFAULT 'low', -- low, medium, high, critical
  temperature DOUBLE PRECISION,
  humidity DOUBLE PRECISION,
  wind_speed DOUBLE PRECISION,
  visibility DOUBLE PRECISION,
  alert_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  route_adjustment_suggested TEXT, -- suggested route changes
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.weather_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for weather alerts
CREATE POLICY "Drivers can view their own weather alerts" 
ON public.weather_alerts 
FOR SELECT 
USING (driver_id IN (
  SELECT d.id FROM drivers d WHERE d.profile_id = auth.uid()
));

CREATE POLICY "System can insert weather alerts" 
ON public.weather_alerts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Drivers can acknowledge their weather alerts" 
ON public.weather_alerts 
FOR UPDATE 
USING (driver_id IN (
  SELECT d.id FROM drivers d WHERE d.profile_id = auth.uid()
))
WITH CHECK (driver_id IN (
  SELECT d.id FROM drivers d WHERE d.profile_id = auth.uid()
));

CREATE POLICY "Admins can view and manage all weather alerts" 
ON public.weather_alerts 
FOR ALL 
USING (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_weather_alerts_updated_at
BEFORE UPDATE ON public.weather_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();