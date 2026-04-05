-- Fix live_locations table constraints
-- Add unique constraint on user_id for proper upsert functionality
ALTER TABLE public.live_locations ADD CONSTRAINT live_locations_user_id_unique UNIQUE (user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_live_locations_user_type_active ON public.live_locations(user_type, is_active);