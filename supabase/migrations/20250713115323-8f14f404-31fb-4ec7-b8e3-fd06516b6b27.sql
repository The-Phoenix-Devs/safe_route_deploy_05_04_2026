
-- Add mobile_number column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN mobile_number TEXT;

-- Create index for mobile number lookups
CREATE INDEX idx_profiles_mobile_number ON public.profiles(mobile_number);

-- Add mobile_number to drivers table (if not already present)
ALTER TABLE public.drivers 
ADD COLUMN mobile_number TEXT;

-- Add mobile_number to students table for guardian contact
ALTER TABLE public.students 
ADD COLUMN guardian_mobile TEXT;

-- Update existing students to use mobile numbers instead of just names
-- This will help link guardians to students via mobile numbers
