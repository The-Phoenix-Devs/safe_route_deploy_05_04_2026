-- Create profiles table for users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  firebase_uid TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('admin', 'driver', 'guardian')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create drivers table
CREATE TABLE public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  license_number TEXT,
  bus_number TEXT NOT NULL UNIQUE,
  qr_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  guardian_name TEXT NOT NULL,
  guardian_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  pickup_point TEXT NOT NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  bus_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (firebase_uid = auth.jwt() ->> 'sub');

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE firebase_uid = auth.jwt() ->> 'sub' 
  AND user_type = 'admin'
));

CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE firebase_uid = auth.jwt() ->> 'sub' 
  AND user_type = 'admin'
));

CREATE POLICY "Admins can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE firebase_uid = auth.jwt() ->> 'sub' 
  AND user_type = 'admin'
));

-- Create policies for drivers
CREATE POLICY "Admins can manage drivers" 
ON public.drivers 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE firebase_uid = auth.jwt() ->> 'sub' 
  AND user_type = 'admin'
));

CREATE POLICY "Drivers can view their own data" 
ON public.drivers 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = profile_id 
  AND p.firebase_uid = auth.jwt() ->> 'sub'
));

-- Create policies for students
CREATE POLICY "Admins can manage students" 
ON public.students 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE firebase_uid = auth.jwt() ->> 'sub' 
  AND user_type = 'admin'
));

CREATE POLICY "Guardians can view their students" 
ON public.students 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = guardian_profile_id 
  AND p.firebase_uid = auth.jwt() ->> 'sub'
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON public.drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();