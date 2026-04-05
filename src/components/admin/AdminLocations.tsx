
import React from 'react';
import LiveOpenLayersMap from '@/components/map/LiveOpenLayersMap';
import BusEstimatedArrival from '@/components/admin/map/BusEstimatedArrival';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMapData } from '@/components/map/useMapData';

const AdminLocations: React.FC = () => {
  const { busLocations, routes, error, isLoading } = useMapData();

  // School location (you can make this configurable)
  const schoolLocation = {
    latitude: 22.7826, // Default coordinates - can be made configurable
    longitude: 87.7747
  };

  return (
    <div className="space-y-6">
      {/* Estimated Arrival Times */}
      <BusEstimatedArrival 
        buses={busLocations} 
        schoolLocation={schoolLocation}
      />
      
      {/* Live Map */}
      <Card>
        <CardHeader>
          <CardTitle>Live Driver Tracking</CardTitle>
          <p className="text-muted-foreground">
            Real-time locations of drivers who have started their trips
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <LiveOpenLayersMap
            busLocations={busLocations}
            routes={routes}
            error={error}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLocations;
