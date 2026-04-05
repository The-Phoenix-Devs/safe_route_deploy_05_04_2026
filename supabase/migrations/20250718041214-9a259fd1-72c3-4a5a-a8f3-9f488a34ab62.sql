-- Clear all existing data from the application tables

-- Delete all pickup/drop history first (has foreign key to students and drivers)
DELETE FROM public.pickup_drop_history;

-- Delete all trip sessions (has foreign key to drivers)
DELETE FROM public.trip_sessions;

-- Delete all students (has foreign key to drivers and profiles)
DELETE FROM public.students;

-- Delete all drivers (has foreign key to profiles and routes)
DELETE FROM public.drivers;

-- Delete all routes
DELETE FROM public.routes;

-- Delete all live locations
DELETE FROM public.live_locations;

-- Delete all notification logs
DELETE FROM public.notification_logs;

-- Delete all user logs
DELETE FROM public.user_logs;

-- Delete all security audit logs
DELETE FROM public.security_audit_log;

-- Delete all profiles
DELETE FROM public.profiles;

-- Create the new admin user profile
INSERT INTO public.profiles (
  firebase_uid,
  email,
  username,
  user_type,
  created_at,
  updated_at
) VALUES (
  'admin-uid-subhankar-ghorui',
  'subhankar.ghorui1995@gmail.com',
  'admin',
  'admin',
  now(),
  now()
);