-- Fix foreign key relationship for parent_feedback table
ALTER TABLE public.parent_feedback 
DROP CONSTRAINT IF EXISTS parent_feedback_guardian_profile_id_fkey;

ALTER TABLE public.parent_feedback 
ADD CONSTRAINT parent_feedback_guardian_profile_id_fkey 
FOREIGN KEY (guardian_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Also add proper foreign keys for student_id and driver_id
ALTER TABLE public.parent_feedback 
DROP CONSTRAINT IF EXISTS parent_feedback_student_id_fkey;

ALTER TABLE public.parent_feedback 
ADD CONSTRAINT parent_feedback_student_id_fkey 
FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.parent_feedback 
DROP CONSTRAINT IF EXISTS parent_feedback_driver_id_fkey;

ALTER TABLE public.parent_feedback 
ADD CONSTRAINT parent_feedback_driver_id_fkey 
FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE SET NULL;

-- Add an index for better performance
CREATE INDEX IF NOT EXISTS idx_parent_feedback_guardian_profile_id ON public.parent_feedback(guardian_profile_id);
CREATE INDEX IF NOT EXISTS idx_parent_feedback_status ON public.parent_feedback(status);
CREATE INDEX IF NOT EXISTS idx_parent_feedback_created_at ON public.parent_feedback(created_at);

-- Add a function to automatically set driver_id when student_id is provided
CREATE OR REPLACE FUNCTION public.set_feedback_driver_from_student()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.student_id IS NOT NULL AND NEW.driver_id IS NULL THEN
    SELECT driver_id INTO NEW.driver_id 
    FROM public.students 
    WHERE id = NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set driver_id
DROP TRIGGER IF EXISTS set_feedback_driver_trigger ON public.parent_feedback;
CREATE TRIGGER set_feedback_driver_trigger
  BEFORE INSERT OR UPDATE ON public.parent_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.set_feedback_driver_from_student();