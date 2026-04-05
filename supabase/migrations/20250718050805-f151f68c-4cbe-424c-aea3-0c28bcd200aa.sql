-- Add foreign key constraints for proper relationships
-- This ensures data integrity between routes, drivers, and students

-- Add foreign key constraint from drivers to routes
ALTER TABLE public.drivers 
ADD CONSTRAINT drivers_route_id_fkey 
FOREIGN KEY (route_id) 
REFERENCES public.routes(id) 
ON DELETE SET NULL;

-- Add foreign key constraint from students to drivers  
ALTER TABLE public.students 
ADD CONSTRAINT students_driver_id_fkey 
FOREIGN KEY (driver_id) 
REFERENCES public.drivers(id) 
ON DELETE SET NULL;

-- Add foreign key constraint from students to guardian profiles
ALTER TABLE public.students 
ADD CONSTRAINT students_guardian_profile_id_fkey 
FOREIGN KEY (guardian_profile_id) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- Add foreign key constraint from drivers to profiles
ALTER TABLE public.drivers 
ADD CONSTRAINT drivers_profile_id_fkey 
FOREIGN KEY (profile_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;