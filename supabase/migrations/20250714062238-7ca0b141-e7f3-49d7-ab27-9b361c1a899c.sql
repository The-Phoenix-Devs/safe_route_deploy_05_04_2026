-- Create routes table
CREATE TABLE public.routes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    start_point TEXT NOT NULL,
    end_point TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

-- Create policies for routes
CREATE POLICY "Allow authenticated users to manage routes" 
ON public.routes 
FOR ALL 
USING ((auth.role() = 'authenticated'::text) OR (auth.role() = 'anon'::text));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_routes_updated_at
BEFORE UPDATE ON public.routes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add route_id column to drivers table to link drivers with routes
ALTER TABLE public.drivers 
ADD COLUMN route_id UUID REFERENCES public.routes(id);