-- Create index for better live location queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_live_locations_user_id_active ON public.live_locations(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_live_locations_active_timestamp ON public.live_locations(is_active, timestamp DESC);

-- Create trip_sessions table to track active trips
CREATE TABLE public.trip_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
  bus_number text NOT NULL,
  start_time timestamp with time zone NOT NULL DEFAULT now(),
  end_time timestamp with time zone,
  route_id uuid REFERENCES public.routes(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on trip_sessions
ALTER TABLE public.trip_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for trip_sessions
CREATE POLICY "Allow authenticated users to manage trip sessions"
  ON public.trip_sessions
  FOR ALL
  TO authenticated, anon
  USING (true);

-- Add trigger for trip_sessions
CREATE TRIGGER update_trip_sessions_updated_at
  BEFORE UPDATE ON public.trip_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();