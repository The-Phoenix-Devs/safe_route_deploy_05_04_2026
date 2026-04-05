
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Square, Play } from 'lucide-react';
import { useLiveTracking } from '@/hooks/useLiveTracking';
import { useAuth } from '@/contexts/AuthContext';

interface LiveTrackingPanelProps {
  busNumber: string;
  driverName: string;
}

const LiveTrackingPanel: React.FC<LiveTrackingPanelProps> = ({ busNumber, driverName }) => {
  const { user } = useAuth();
  const { isTracking, startTracking, stopTracking, error } = useLiveTracking();
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Get current location for display
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting current location:', error);
        }
      );
    }
  }, []);

  const handleStartTracking = async () => {
    if (user?.id) {
      await startTracking(user.id, 'driver', busNumber, driverName);
    }
  };

  const handleStopTracking = async () => {
    if (user?.id) {
      await stopTracking(user.id);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Live Location Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Status</p>
            <Badge variant={isTracking ? "default" : "secondary"}>
              {isTracking ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium">Bus Number</p>
            <p className="text-sm text-muted-foreground">{busNumber}</p>
          </div>
        </div>

        {currentLocation && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Current Location
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Lat: {currentLocation.latitude.toFixed(6)}</p>
              <p>Lng: {currentLocation.longitude.toFixed(6)}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          {!isTracking ? (
            <Button onClick={handleStartTracking} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              Start Tracking
            </Button>
          ) : (
            <Button onClick={handleStopTracking} variant="outline" className="flex-1">
              <Square className="h-4 w-4 mr-2" />
              Stop Tracking
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <p>• Location updates every 5 seconds</p>
          <p>• Guardians can see your bus location in real-time</p>
          <p>• Turn off when shift ends to save battery</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveTrackingPanel;
