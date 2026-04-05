import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StudentData {
  student_id: string;
  student_name: string;
  grade: string;
  pickup_point: string;
  pickup_location_lat?: number;
  pickup_location_lng?: number;
  bus_number: string;
  driver_id: string;
  driver_name: string;
  driver_mobile: string;
  route_name: string;
}

interface DriverLocation {
  driver_id: string;
  driver_name: string;
  bus_number: string;
  latitude?: number;
  longitude?: number;
  last_updated?: string;
  is_active?: boolean;
}

export const useGuardianData = (guardianId: string | null) => {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!guardianId) return;

    const fetchGuardianData = async () => {
      try {
        setLoading(true);

        // Get students for this guardian
        const { data: studentsData, error: studentsError } = await supabase
          .rpc('get_guardian_with_students', { guardian_profile_id: guardianId });

        if (studentsError) throw studentsError;

        if (studentsData && studentsData.length > 0) {
          setStudents(studentsData);

          // Get driver location for the first student (assuming one student per guardian for now)
          const firstStudent = studentsData[0];
          if (firstStudent.student_id) {
            const { data: locationData, error: locationError } = await supabase
              .rpc('get_student_driver_location', { student_id: firstStudent.student_id });

            if (locationError) {
              console.error('Location error:', locationError);
            } else if (locationData && locationData.length > 0) {
              const location = locationData[0];
              setDriverLocation(location);

              // Calculate estimated time if we have pickup location and driver location
              if (firstStudent.pickup_location_lat && firstStudent.pickup_location_lng &&
                  location.latitude && location.longitude) {
                const distance = calculateDistance(
                  location.latitude,
                  location.longitude,
                  firstStudent.pickup_location_lat,
                  firstStudent.pickup_location_lng
                );
                
                // Estimate time based on average speed of 30 km/h
                const timeInMinutes = Math.round((distance / 30) * 60);
                setEstimatedTime(`${timeInMinutes} minutes`);
              }
            }
          }
        }
      } catch (error: any) {
        console.error('Error fetching guardian data:', error);
        toast({
          title: "Error",
          description: "Failed to load student information",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGuardianData();

    // Set up real-time subscription for driver location updates
    const subscription = supabase
      .channel('live-locations-guardian')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'live_locations' 
        }, 
        (payload) => {
          if (payload.new && students.length > 0) {
            const firstStudent = students[0];
            const newData = payload.new as any;
            if (newData.user_type === 'driver' && 
                driverLocation && 
                newData.user_id === driverLocation.driver_id) {
              setDriverLocation(prev => prev ? {
                ...prev,
                latitude: newData.latitude,
                longitude: newData.longitude,
                last_updated: newData.timestamp,
                is_active: newData.is_active
              } : null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [guardianId, toast]);

  return {
    students,
    driverLocation,
    loading,
    estimatedTime
  };
};

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in kilometers
  return d;
}