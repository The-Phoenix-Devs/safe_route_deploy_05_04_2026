-- Create tables for advanced analytics

-- Traffic data integration
CREATE TABLE IF NOT EXISTS public.traffic_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID REFERENCES public.routes(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  traffic_density TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, severe
  average_speed DOUBLE PRECISION,
  congestion_level INTEGER DEFAULT 0, -- 0-10 scale
  incident_reported BOOLEAN DEFAULT false,
  weather_impact TEXT,
  data_source TEXT DEFAULT 'system',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ETA predictions and machine learning data
CREATE TABLE IF NOT EXISTS public.eta_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID REFERENCES public.routes(id),
  driver_id UUID REFERENCES public.drivers(id),
  predicted_eta TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_eta TIMESTAMP WITH TIME ZONE,
  prediction_accuracy DOUBLE PRECISION, -- calculated after actual arrival
  traffic_factor DOUBLE PRECISION DEFAULT 1.0,
  weather_factor DOUBLE PRECISION DEFAULT 1.0,
  historical_factor DOUBLE PRECISION DEFAULT 1.0,
  model_version TEXT DEFAULT 'v1.0',
  confidence_score DOUBLE PRECISION DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Student attendance and behavior analytics
CREATE TABLE IF NOT EXISTS public.student_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id),
  date DATE NOT NULL,
  attendance_status TEXT NOT NULL DEFAULT 'present', -- present, absent, late
  pickup_time TIMESTAMP WITH TIME ZONE,
  dropoff_time TIMESTAMP WITH TIME ZONE,
  delay_minutes INTEGER DEFAULT 0,
  behavior_score INTEGER DEFAULT 5, -- 1-5 scale
  location_accuracy DOUBLE PRECISION,
  guardian_notified BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, date)
);

-- Fuel optimization and route efficiency
CREATE TABLE IF NOT EXISTS public.route_efficiency (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID REFERENCES public.routes(id),
  driver_id UUID REFERENCES public.drivers(id),
  date DATE NOT NULL,
  total_distance DOUBLE PRECISION NOT NULL,
  fuel_consumed DOUBLE PRECISION,
  fuel_efficiency DOUBLE PRECISION, -- km per liter
  optimal_distance DOUBLE PRECISION, -- AI calculated optimal distance
  efficiency_score DOUBLE PRECISION, -- percentage vs optimal
  co2_emissions DOUBLE PRECISION,
  cost_analysis JSONB DEFAULT '{}',
  optimization_suggestions TEXT[],
  traffic_delays INTEGER DEFAULT 0, -- minutes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Advanced KPI tracking
CREATE TABLE IF NOT EXISTS public.performance_kpis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_category TEXT NOT NULL, -- efficiency, safety, satisfaction, cost
  metric_value DOUBLE PRECISION NOT NULL,
  target_value DOUBLE PRECISION,
  unit TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  driver_id UUID REFERENCES public.drivers(id),
  route_id UUID REFERENCES public.routes(id),
  trend_direction TEXT DEFAULT 'stable', -- improving, declining, stable
  benchmark_comparison DOUBLE PRECISION, -- vs industry standard
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ML model training data and results
CREATE TABLE IF NOT EXISTS public.ml_model_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_type TEXT NOT NULL, -- eta_prediction, fuel_optimization, behavior_analysis
  model_version TEXT NOT NULL,
  training_data JSONB NOT NULL,
  model_parameters JSONB,
  accuracy_metrics JSONB,
  last_trained TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  performance_score DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.traffic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eta_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_efficiency ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_model_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage traffic data" ON public.traffic_data FOR ALL USING (is_admin());
CREATE POLICY "All authenticated users can view traffic data" ON public.traffic_data FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage ETA predictions" ON public.eta_predictions FOR ALL USING (is_admin());
CREATE POLICY "Drivers can view their ETA predictions" ON public.eta_predictions FOR SELECT USING (
  driver_id IN (SELECT d.id FROM drivers d WHERE d.profile_id = auth.uid())
);

CREATE POLICY "Admins can manage student analytics" ON public.student_analytics FOR ALL USING (is_admin());
CREATE POLICY "Guardians can view their students analytics" ON public.student_analytics FOR SELECT USING (
  student_id IN (SELECT s.id FROM students s WHERE s.guardian_profile_id = auth.uid())
);

CREATE POLICY "Admins can manage route efficiency" ON public.route_efficiency FOR ALL USING (is_admin());
CREATE POLICY "Drivers can view their route efficiency" ON public.route_efficiency FOR SELECT USING (
  driver_id IN (SELECT d.id FROM drivers d WHERE d.profile_id = auth.uid())
);

CREATE POLICY "Admins can manage performance KPIs" ON public.performance_kpis FOR ALL USING (is_admin());
CREATE POLICY "Drivers can view their KPIs" ON public.performance_kpis FOR SELECT USING (
  driver_id IN (SELECT d.id FROM drivers d WHERE d.profile_id = auth.uid()) OR driver_id IS NULL
);

CREATE POLICY "Admins can manage ML model data" ON public.ml_model_data FOR ALL USING (is_admin());

-- Add triggers for updated_at
CREATE TRIGGER update_traffic_data_updated_at BEFORE UPDATE ON public.traffic_data
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_eta_predictions_updated_at BEFORE UPDATE ON public.eta_predictions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_analytics_updated_at BEFORE UPDATE ON public.student_analytics
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_route_efficiency_updated_at BEFORE UPDATE ON public.route_efficiency
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_kpis_updated_at BEFORE UPDATE ON public.performance_kpis
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ml_model_data_updated_at BEFORE UPDATE ON public.ml_model_data
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_traffic_data_route_timestamp ON public.traffic_data(route_id, timestamp);
CREATE INDEX idx_eta_predictions_route_created ON public.eta_predictions(route_id, created_at);
CREATE INDEX idx_student_analytics_student_date ON public.student_analytics(student_id, date);
CREATE INDEX idx_route_efficiency_route_date ON public.route_efficiency(route_id, date);
CREATE INDEX idx_performance_kpis_category_period ON public.performance_kpis(metric_category, period_start, period_end);
CREATE INDEX idx_ml_model_data_type_active ON public.ml_model_data(model_type, is_active);