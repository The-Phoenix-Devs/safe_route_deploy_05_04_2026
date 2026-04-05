import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DriverData {
  id: string;
  name: string;
  bus_number: string;
  mobile_number: string;
  license_number?: string;
  route?: {
    id: string;
    name: string;
    start_point: string;
    end_point: string;
  };
}

interface StudentData {
  id: string;
  name: string;
  grade: string;
  guardian_name: string;
  guardian_mobile: string;
  pickup_point: string;
  pickup_location_lat?: number;
  pickup_location_lng?: number;
}

export const useDriverData = (profileId: string | null) => {
  const [driverData, setDriverData] = useState<DriverData | null>(null);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!profileId) {
      setLoading(false);
      return;
    }

    const loadDriverData = async () => {
      try {
        setLoading(true);
        
        // Get driver profile with route information
        const { data: driver, error: driverError } = await supabase
          .from('drivers')
          .select(`
            id,
            name,
            bus_number,
            mobile_number,
            license_number,
            route:routes(
              id,
              name,
              start_point,
              end_point
            )
          `)
          .eq('profile_id', profileId)
          .single();

        if (driverError) {
          console.error('Error loading driver:', driverError);
          toast({
            title: "Error",
            description: "Failed to load driver profile. Please contact admin.",
            variant: "destructive",
          });
          return;
        }

        const routeRaw = driver.route as
          | DriverData["route"]
          | DriverData["route"][]
          | null
          | undefined;
        const route = Array.isArray(routeRaw) ? routeRaw[0] : routeRaw;
        setDriverData({
          ...driver,
          route: route ?? undefined,
        });

        // Get students assigned to this driver
        const { data: studentsList, error: studentsError } = await supabase
          .from('students')
          .select(`
            id,
            name,
            grade,
            guardian_name,
            guardian_mobile,
            pickup_point,
            pickup_location_lat,
            pickup_location_lng
          `)
          .eq('driver_id', driver.id);

        if (studentsError) {
          console.error('Error loading students:', studentsError);
          toast({
            title: "Warning",
            description: "Failed to load student list",
            variant: "destructive",
          });
        } else {
          setStudents(studentsList || []);
        }
      } catch (error) {
        console.error('Error loading driver data:', error);
        toast({
          title: "Error",
          description: "Failed to load driver data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDriverData();
  }, [profileId, toast]);

  return {
    driverData,
    students,
    loading
  };
};