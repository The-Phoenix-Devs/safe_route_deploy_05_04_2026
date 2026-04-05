-- Enable real-time updates for live_locations table
ALTER TABLE public.live_locations REPLICA IDENTITY FULL;

-- Add the table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_locations;

-- Enable real-time updates for trip_sessions table
ALTER TABLE public.trip_sessions REPLICA IDENTITY FULL;

-- Add trip_sessions to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_sessions;