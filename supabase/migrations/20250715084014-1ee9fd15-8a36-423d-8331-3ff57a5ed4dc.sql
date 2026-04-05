-- Add FCM token field to profiles table for push notifications
ALTER TABLE public.profiles 
ADD COLUMN fcm_token TEXT;

-- Create index for faster lookups
CREATE INDEX idx_profiles_fcm_token ON public.profiles(fcm_token) WHERE fcm_token IS NOT NULL;