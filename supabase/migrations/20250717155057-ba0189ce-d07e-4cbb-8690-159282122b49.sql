-- Create function to close all active user sessions
CREATE OR REPLACE FUNCTION public.close_all_active_sessions()
RETURNS TABLE(
  sessions_closed integer,
  locations_cleared integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_count integer;
  location_count integer;
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Clear all active live locations (this effectively logs out tracking users)
  UPDATE public.live_locations 
  SET is_active = false, updated_at = now()
  WHERE is_active = true;
  
  GET DIAGNOSTICS location_count = ROW_COUNT;

  -- Clear FCM tokens to prevent push notifications
  UPDATE public.profiles 
  SET fcm_token = null, updated_at = now()
  WHERE fcm_token IS NOT NULL;
  
  GET DIAGNOSTICS session_count = ROW_COUNT;

  -- Return the counts
  RETURN QUERY SELECT session_count, location_count;
END;
$$;