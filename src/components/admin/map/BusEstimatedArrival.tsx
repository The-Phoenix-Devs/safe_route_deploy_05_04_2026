import React from 'react';
import { Clock, Bus, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BusLocation {
  id: string;
  busNumber: string;
  driverName: string;
  position: {
    longitude: number;
    latitude: number;
  };
  speed: number;
  timestamp: Date;
}

interface BusEstimatedArrivalProps {
  buses: BusLocation[];
  schoolLocation: {
    latitude: number;
    longitude: number;
  };
}

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Calculate estimated time of arrival
const calculateETA = (bus: BusLocation, schoolLocation: { latitude: number; longitude: number }) => {
  const distance = calculateDistance(
    bus.position.latitude,
    bus.position.longitude,
    schoolLocation.latitude,
    schoolLocation.longitude
  );
  
  // Convert speed from m/s to km/h (assuming speed is in m/s)
  const speedKmh = bus.speed * 3.6;
  
  // If speed is too low, assume average speed of 30 km/h
  const effectiveSpeed = speedKmh > 5 ? speedKmh : 30;
  
  // Calculate time in hours
  const timeHours = distance / effectiveSpeed;
  
  // Convert to minutes
  const timeMinutes = Math.round(timeHours * 60);
  
  return {
    distance: distance.toFixed(1),
    timeMinutes,
    speedKmh: speedKmh.toFixed(1)
  };
};

// Format time for display
const formatETA = (minutes: number): string => {
  if (minutes < 1) return 'Arriving now';
  if (minutes < 60) return `${minutes} min`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};

// Get status color based on ETA
const getStatusColor = (minutes: number): string => {
  if (minutes < 5) return 'bg-green-500';
  if (minutes < 15) return 'bg-yellow-500';
  if (minutes < 30) return 'bg-orange-500';
  return 'bg-blue-500';
};

const BusEstimatedArrival: React.FC<BusEstimatedArrivalProps> = ({ 
  buses, 
  schoolLocation = { latitude: 22.7826, longitude: 87.7747 } // Default school location
}) => {
  const activeBuses = buses.filter(bus => {
    // Consider bus active if updated within last 24 hours (instead of 10 minutes)
    const lastUpdate = new Date(bus.timestamp);
    const now = new Date();
    const timeDiff = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60); // hours
    return timeDiff <= 24;
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bus className="h-5 w-5 text-primary" />
          Active Buses - Estimated Arrival Times
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Real-time tracking of {activeBuses.length} active buses
        </p>
      </CardHeader>
      <CardContent>
        {activeBuses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bus className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No active buses currently tracked</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeBuses.map(bus => {
              const eta = calculateETA(bus, schoolLocation);
              const statusColor = getStatusColor(eta.timeMinutes);
              
              return (
                <div key={bus.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${statusColor}`} />
                      <div>
                        <h3 className="font-semibold text-lg">{bus.busNumber}</h3>
                        <p className="text-sm text-muted-foreground">{bus.driverName}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-sm">
                      <Clock className="h-3 w-3 mr-1" />
                      ETA: {formatETA(eta.timeMinutes)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Distance:</span>
                      <span className="font-medium">{eta.distance} km</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <span className="text-muted-foreground">Speed:</span>
                      <span className="font-medium">{eta.speedKmh} km/h</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Last Update:</span>
                      <span className="font-medium">
                        {new Date(bus.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BusEstimatedArrival;