
-- Create the live_locations table for real-time tracking
CREATE TABLE public.live_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('driver', 'bus')),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  bus_number TEXT,
  driver_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.live_locations ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view all active locations (needed for tracking)
CREATE POLICY "Allow viewing active locations" 
  ON public.live_locations 
  FOR SELECT 
  USING (is_active = true);

-- Create policy for users to insert/update their own location
CREATE POLICY "Users can manage their own location" 
  ON public.live_locations 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Enable realtime for live location updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_locations;

-- Add trigger to update the updated_at column
CREATE TRIGGER update_live_locations_updated_at
  BEFORE UPDATE ON public.live_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
