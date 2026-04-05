-- Create parent feedback table
CREATE TABLE public.parent_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guardian_profile_id UUID NOT NULL,
  student_id UUID,
  driver_id UUID,
  feedback_type TEXT NOT NULL, -- compliment, complaint, suggestion, safety_concern
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, resolved, closed
  admin_response TEXT,
  admin_responder_id UUID,
  response_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create holiday/event schedule table
CREATE TABLE public.holiday_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_pattern TEXT, -- yearly, monthly, weekly
  affects_routes BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analytics summary table for performance tracking
CREATE TABLE public.analytics_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  route_id UUID,
  driver_id UUID,
  total_trips INTEGER NOT NULL DEFAULT 0,
  on_time_trips INTEGER NOT NULL DEFAULT 0,
  delayed_trips INTEGER NOT NULL DEFAULT 0,
  cancelled_trips INTEGER NOT NULL DEFAULT 0,
  total_students INTEGER NOT NULL DEFAULT 0,
  average_speed DOUBLE PRECISION,
  fuel_consumed DOUBLE PRECISION,
  distance_traveled DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, route_id, driver_id)
);

-- Enable Row Level Security
ALTER TABLE public.parent_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holiday_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_summary ENABLE ROW LEVEL SECURITY;

-- Create policies for parent feedback
CREATE POLICY "Guardians can create their own feedback" 
ON public.parent_feedback 
FOR INSERT 
WITH CHECK (guardian_profile_id = auth.uid());

CREATE POLICY "Guardians can view their own feedback" 
ON public.parent_feedback 
FOR SELECT 
USING (guardian_profile_id = auth.uid());

CREATE POLICY "Admins can view and manage all feedback" 
ON public.parent_feedback 
FOR ALL 
USING (is_admin());

-- Create policies for holiday schedule
CREATE POLICY "Admins can manage holiday schedule" 
ON public.holiday_schedule 
FOR ALL 
USING (is_admin());

CREATE POLICY "All authenticated users can view holidays" 
ON public.holiday_schedule 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create policies for analytics summary
CREATE POLICY "Admins can manage analytics data" 
ON public.analytics_summary 
FOR ALL 
USING (is_admin());

CREATE POLICY "Drivers can view their own analytics" 
ON public.analytics_summary 
FOR SELECT 
USING (driver_id IN (
  SELECT d.id FROM drivers d WHERE d.profile_id = auth.uid()
));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_parent_feedback_updated_at
BEFORE UPDATE ON public.parent_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_holiday_schedule_updated_at
BEFORE UPDATE ON public.holiday_schedule
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analytics_summary_updated_at
BEFORE UPDATE ON public.analytics_summary
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();