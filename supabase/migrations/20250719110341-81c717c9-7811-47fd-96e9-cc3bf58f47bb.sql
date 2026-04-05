-- Fix the remaining UUID = TEXT error in deletion functions
-- The user_logs.user_id column is actually UUID type, not TEXT

DROP FUNCTION IF EXISTS public.delete_driver_and_cleanup(uuid);

CREATE OR REPLACE FUNCTION public.delete_driver_and_cleanup(driver_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
  
  -- 10. Delete user logs - FIX: user_id is UUID, not TEXT
  DELETE FROM public.user_logs 
  WHERE user_id = driver_profile_id;
  
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

-- Also fix the student deletion function
DROP FUNCTION IF EXISTS public.delete_student_and_cleanup(uuid);

CREATE OR REPLACE FUNCTION public.delete_student_and_cleanup(student_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  student_guardian_profile_id UUID;
  student_guardian_mobile TEXT;
  other_students_count INTEGER := 0;
  student_exists BOOLEAN := FALSE;
BEGIN
  -- Note: This function now allows system-level deletions
  -- It will be called by admin users through the application

  -- Get student's guardian info and check if student exists
  SELECT guardian_profile_id, guardian_mobile INTO student_guardian_profile_id, student_guardian_mobile
  FROM public.students 
  WHERE id = student_id_param;

  IF student_guardian_profile_id IS NULL AND student_guardian_mobile IS NULL THEN
    RETURN FALSE; -- Student doesn't exist
  END IF;

  student_exists := TRUE;

  -- Delete related data
  
  -- 1. Delete pickup/drop history for this student
  DELETE FROM public.pickup_drop_history 
  WHERE student_id = student_id_param;
  
  -- 2. Delete parent feedback for this student
  DELETE FROM public.parent_feedback 
  WHERE student_id = student_id_param;
  
  -- 3. Delete the student record
  DELETE FROM public.students 
  WHERE id = student_id_param;
  
  -- 4. Check if guardian has other students and cleanup if needed
  IF student_guardian_profile_id IS NOT NULL THEN
    -- Check if guardian has other students
    SELECT COUNT(*) INTO other_students_count
    FROM public.students 
    WHERE guardian_profile_id = student_guardian_profile_id;
    
    -- If no other students, delete guardian profile and related data
    IF other_students_count = 0 THEN
      -- Delete guardian's notification logs
      DELETE FROM public.notification_logs 
      WHERE user_id = student_guardian_profile_id;
      
      -- Delete guardian's user logs - FIX: user_id is UUID, not TEXT
      DELETE FROM public.user_logs 
      WHERE user_id = student_guardian_profile_id;
      
      -- Delete guardian's chat messages
      DELETE FROM public.chat_messages 
      WHERE sender_id = student_guardian_profile_id OR recipient_id = student_guardian_profile_id;
      
      -- Delete guardian's feedback
      DELETE FROM public.parent_feedback 
      WHERE guardian_profile_id = student_guardian_profile_id;
      
      -- Delete guardian profile
      DELETE FROM public.profiles 
      WHERE id = student_guardian_profile_id;
    END IF;
  ELSIF student_guardian_mobile IS NOT NULL THEN
    -- Check if there are other students with the same guardian mobile
    SELECT COUNT(*) INTO other_students_count
    FROM public.students 
    WHERE guardian_mobile = student_guardian_mobile;
    
    -- If no other students with same mobile, cleanup any profiles with that mobile
    IF other_students_count = 0 THEN
      -- Find and delete guardian profiles with this mobile number
      DELETE FROM public.profiles 
      WHERE mobile_number = student_guardian_mobile AND user_type = 'guardian';
    END IF;
  END IF;

  RETURN student_exists;
END;
$function$;