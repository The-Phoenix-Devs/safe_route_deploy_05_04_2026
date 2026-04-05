-- Create pickup_drop_history table for tracking student pickup and drop events
CREATE TABLE public.pickup_drop_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('pickup', 'drop')),
  event_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  location_lat NUMERIC,
  location_lng NUMERIC,
  location_name TEXT,
  bus_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.pickup_drop_history 
ADD CONSTRAINT pickup_drop_history_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.pickup_drop_history 
ADD CONSTRAINT pickup_drop_history_driver_id_fkey 
FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.pickup_drop_history ENABLE ROW LEVEL SECURITY;

-- Create policies for guardian access
CREATE POLICY "Guardians can view their students pickup drop history" 
ON public.pickup_drop_history 
FOR SELECT 
USING (
  student_id IN (
    SELECT s.id 
    FROM public.students s 
    WHERE s.guardian_profile_id = auth.uid()
  )
);

-- Create policies for driver access
CREATE POLICY "Drivers can insert pickup drop events" 
ON public.pickup_drop_history 
FOR INSERT 
WITH CHECK (
  driver_id IN (
    SELECT d.id 
    FROM public.drivers d 
    WHERE d.profile_id = auth.uid()
  )
);

CREATE POLICY "Drivers can view their pickup drop history" 
ON public.pickup_drop_history 
FOR SELECT 
USING (
  driver_id IN (
    SELECT d.id 
    FROM public.drivers d 
    WHERE d.profile_id = auth.uid()
  )
);

-- Create policies for admin access
CREATE POLICY "Admins can manage all pickup drop history" 
ON public.pickup_drop_history 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

-- Create function to get guardian pickup drop history
CREATE OR REPLACE FUNCTION public.get_guardian_pickup_drop_history(guardian_profile_id UUID)
RETURNS TABLE(
  id UUID,
  student_id UUID,
  student_name TEXT,
  driver_name TEXT,
  event_type TEXT,
  event_time TIMESTAMP WITH TIME ZONE,
  location_lat NUMERIC,
  location_lng NUMERIC,
  location_name TEXT,
  bus_number TEXT,
  notes TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pdh.id,
    pdh.student_id,
    s.name as student_name,
    d.name as driver_name,
    pdh.event_type,
    pdh.event_time,
    pdh.location_lat,
    pdh.location_lng,
    pdh.location_name,
    pdh.bus_number,
    pdh.notes
  FROM public.pickup_drop_history pdh
  JOIN public.students s ON pdh.student_id = s.id
  JOIN public.drivers d ON pdh.driver_id = d.id
  WHERE s.guardian_profile_id = get_guardian_pickup_drop_history.guardian_profile_id
  ORDER BY pdh.event_time DESC;
END;
$$;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pickup_drop_history_updated_at
BEFORE UPDATE ON public.pickup_drop_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for the table
ALTER TABLE public.pickup_drop_history REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pickup_drop_history;