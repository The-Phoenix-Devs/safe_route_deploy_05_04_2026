-- Clear all existing data from the application tables

-- Delete all trip sessions first (has foreign key to drivers)
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

-- Delete all profiles except admin profiles
DELETE FROM public.profiles WHERE user_type != 'admin';

-- Reset any sequences if needed (this ensures IDs start fresh)
-- Note: UUIDs don't use sequences, so this is mainly for reference