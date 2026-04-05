import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Square, MapPin, Clock } from 'lucide-react';
import { tripService, type TripSession } from '@/services/tripService';
import { liveTrackingService } from '@/services/liveTrackingService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface StartTripButtonProps {
  driverId: string;
  busNumber: string;
  driverName: string;
}

const StartTripButton: React.FC<StartTripButtonProps> = ({ 
  driverId, 
  busNumber, 
  driverName 
}) => {
  const [activeTrip, setActiveTrip] = useState<TripSession | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    checkActiveTrip();
  }, [driverId]);

  const checkActiveTrip = async () => {
    try {
      const trip = await tripService.getDriverActiveTrip(driverId);
      setActiveTrip(trip);
    } catch (error) {
      console.error('Error checking active trip:', error);
    }
  };

  const startTrip = async () => {
    try {
      setIsStarting(true);
      
      // Start trip session
      const trip = await tripService.startTrip({
        driver_id: driverId,
        bus_number: busNumber,
        driver_name: driverName,
      });

      setActiveTrip(trip);
      setIsTracking(true);
      
      toast({
        title: "Trip Started",
        description: "Location tracking is now active. Students and guardians can track your bus.",
      });
    } catch (error: any) {
      console.error('Error starting trip:', error);
      toast({
        title: "Error Starting Trip",
        description: error.message || 'Failed to start trip',
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  const endTrip = async () => {
    if (!activeTrip) return;
    
    try {
      setIsEnding(true);
      
      // End trip session
      await tripService.endTrip(activeTrip.id);
      
      // Stop location tracking
      liveTrackingService.stopTracking();
      await liveTrackingService.setInactive(driverId);
      
      setActiveTrip(null);
      setIsTracking(false);
      
      toast({
        title: "Trip Ended",
        description: "Location tracking has been stopped.",
      });
    } catch (error: any) {
      console.error('Error ending trip:', error);
      toast({
        title: "Error Ending Trip",
        description: error.message || 'Failed to end trip',
        variant: "destructive",
      });
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Trip Control</h3>
              <p className="text-sm text-muted-foreground">
                Bus: {busNumber}
              </p>
            </div>
            
            {activeTrip ? (
              <Button
                onClick={endTrip}
                disabled={isEnding}
                variant="destructive"
                size="sm"
              >
                <Square className="h-4 w-4 mr-2" />
                {isEnding ? 'Ending...' : 'End Trip'}
              </Button>
            ) : (
              <Button
                onClick={startTrip}
                disabled={isStarting}
                size="sm"
              >
                <Play className="h-4 w-4 mr-2" />
                {isStarting ? 'Starting...' : 'Start Trip'}
              </Button>
            )}
          </div>

          {activeTrip && (
            <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-800">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">Trip Active</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Clock className="h-4 w-4" />
                <span>
                  Started: {new Date(activeTrip.start_time).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs text-green-600">
                Location tracking is active. Your bus can be tracked by students and guardians.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StartTripButton;