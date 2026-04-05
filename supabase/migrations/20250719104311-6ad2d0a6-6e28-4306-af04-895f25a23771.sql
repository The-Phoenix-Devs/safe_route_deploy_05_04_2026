-- Fix the UUID = TEXT error in delete_driver_and_cleanup function
-- The error occurs when comparing uuid and text types

DROP FUNCTION IF EXISTS public.delete_driver_and_cleanup(uuid);

CREATE OR REPLACE FUNCTION public.delete_driver_and_cleanup(driver_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  driver_profile_id UUID;
  driver_exists BOOLEAN := FALSE;
BEGIN
  -- Note: This function now allows system-level deletions
  -- It will be called by admin users through the application

  -- Get the driver's profile_id and check if driver exists
  SELECT profile_id INTO driver_profile_id 
  FROM public.drivers 
  WHERE id = driver_id_param;

  IF driver_profile_id IS NULL THEN
    RETURN FALSE; -- Driver doesn't exist
  END IF;

  driver_exists := TRUE;

  -- Delete related data in correct order (avoid foreign key violations)
  
  -- 1. Delete live locations
  DELETE FROM public.live_locations 
  WHERE user_id = driver_profile_id AND user_type = 'driver';
  
  -- 2. Delete trip sessions
  DELETE FROM public.trip_sessions 
  WHERE driver_id = driver_id_param;
  
  -- 3. Delete pickup/drop history
  DELETE FROM public.pickup_drop_history 
  WHERE driver_id = driver_id_param;
  
  -- 4. Delete panic alerts
  DELETE FROM public.panic_alerts 
  WHERE driver_id = driver_id_param;
  
  -- 5. Delete speed violations
  DELETE FROM public.speed_violations 
  WHERE driver_id = driver_id_param;
  
  -- 6. Delete route deviations
  DELETE FROM public.route_deviations 
  WHERE driver_id = driver_id_param;
  
  -- 7. Delete weather alerts
  DELETE FROM public.weather_alerts 
  WHERE driver_id = driver_id_param;
  
  -- 8. Delete analytics summary
  DELETE FROM public.analytics_summary 
  WHERE driver_id = driver_id_param;
  
  -- 9. Delete notification logs
  DELETE FROM public.notification_logs 
  WHERE user_id = driver_profile_id;
  
  -- 10. Delete user logs - FIX: Cast UUID to TEXT properly
  DELETE FROM public.user_logs 
  WHERE user_id = driver_profile_id::text;
  
  -- 11. Update students to remove driver assignment
  UPDATE public.students 
  SET driver_id = NULL, bus_number = NULL 
  WHERE driver_id = driver_id_param;
  
  -- 12. Delete chat messages
  DELETE FROM public.chat_messages 
  WHERE sender_id = driver_profile_id OR recipient_id = driver_profile_id;
  
  -- 13. Delete the driver record
  DELETE FROM public.drivers 
  WHERE id = driver_id_param;
  
  -- 14. Finally, delete the profile
  DELETE FROM public.profiles 
  WHERE id = driver_profile_id;

  RETURN driver_exists;
END;
$function$;