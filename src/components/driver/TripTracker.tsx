
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface TripTrackerProps {
  isActive: boolean;
  setIsActive: (isActive: boolean) => void;
  tripStartTime: Date | null;
  setTripStartTime: (time: Date | null) => void;
  elapsed: string;
  setElapsed: (elapsed: string) => void;
  location: GeolocationPosition | null;
  setLocation: (location: GeolocationPosition | null) => void;
  watchId: number | null;
  setWatchId: (id: number | null) => void;
  driverId: string;
}

const TripTracker: React.FC<TripTrackerProps> = ({ 
  isActive, 
  elapsed,
  location,
  driverId
}) => {
  const [tripSession, setTripSession] = React.useState<any>(null);

  // Check for active trip session
  React.useEffect(() => {
    const checkTripSession = async () => {
      try {
        const { data, error } = await supabase
          .from('trip_sessions')
          .select('*')
          .eq('driver_id', driverId)
          .eq('status', 'active')
          .single();

        if (data && !error) {
          setTripSession(data);
        }
      } catch (error) {
        console.error('Error checking trip session:', error);
      }
    };

    if (driverId) {
      checkTripSession();
    }
  }, [driverId, isActive]);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Tracking Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium flex items-center">
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${tripSession || isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              {tripSession || isActive ? 'Trip in progress' : 'Not started'}
            </p>
          </div>
          {(tripSession || isActive) && (
            <>
              <div>
                <p className="text-sm text-gray-500">Trip Time</p>
                <p className="font-medium flex items-center">
                  <Clock className="mr-2 h-4 w-4" /> {elapsed}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">GPS Location</p>
                <p className="font-medium flex items-center">
                  <MapPin className="mr-2 h-4 w-4" /> 
                  {location ? 
                    `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}` : 
                    'Acquiring...'}
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TripTracker;
