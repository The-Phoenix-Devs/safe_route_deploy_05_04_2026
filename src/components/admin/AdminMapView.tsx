import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GoogleMap from '@/components/map/GoogleMap';
import { freeMapService } from "@/services/freeMapService";
import type { DriverLocation, TravelTimeResult } from "@/services/mapTypes";
import { useToast } from '@/hooks/use-toast';
import { liveTrackingService, type LiveLocation } from '@/services/liveTrackingService';
import AdminMapStats from './map/AdminMapStats';
import AdminMapControls from './map/AdminMapControls';
import AdminDriverList from './map/AdminDriverList';

interface DriverWithETA extends DriverLocation {
  eta?: TravelTimeResult;
}

const AdminMapView: React.FC = () => {
  const [drivers, setDrivers] = useState<DriverWithETA[]>([]);
  const [isCalculatingETAs, setIsCalculatingETAs] = useState(false);
  const [showOnlyActiveTrips, setShowOnlyActiveTrips] = useState(true);
  const [isLoadingTrips, setIsLoadingTrips] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;

    const loadDrivers = async () => {
      try {
        setIsLoadingTrips(true);
        setFetchError(null);

        let locationData: LiveLocation[];
        if (showOnlyActiveTrips) {
          locationData = await liveTrackingService.getActiveTripLocations();
        } else {
          const all = await liveTrackingService.getActiveLocations();
          locationData = all.filter((l) => l.user_type === 'driver' && l.is_active);
        }

        if (cancelled) return;

        const driverLocations = locationData.map((location) => ({
          driverId: location.user_id,
          driverName: location.driver_name || 'Unknown Driver',
          busNumber: location.bus_number || 'Unknown Bus',
          lat: location.latitude,
          lng: location.longitude,
          timestamp: new Date(location.timestamp),
          isActive: location.is_active,
        }));

        setDrivers((prevDrivers) => {
          const hasChanged =
            JSON.stringify(
              prevDrivers.map((d) => ({
                driverId: d.driverId,
                lat: d.lat,
                lng: d.lng,
                timestamp: d.timestamp.getTime(),
              })),
            ) !==
            JSON.stringify(
              driverLocations.map((d) => ({
                driverId: d.driverId,
                lat: d.lat,
                lng: d.lng,
                timestamp: d.timestamp.getTime(),
              })),
            );

          return hasChanged ? driverLocations : prevDrivers;
        });
      } catch (e: unknown) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'Failed to load driver locations';
          setFetchError(msg);
          console.error('Error fetching driver locations:', e);
        }
      } finally {
        if (!cancelled) setIsLoadingTrips(false);
      }
    };

    void loadDrivers();
    const interval = window.setInterval(loadDrivers, 8000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [showOnlyActiveTrips]);

  useEffect(() => {
    const calculateETAs = async () => {
      if (drivers.length === 0) return;

      setIsCalculatingETAs(true);
      const schoolLocation = freeMapService.getSchoolLocation();

      const driversWithETA = await Promise.all(
        drivers.map(async (driver) => {
          try {
            const eta = await freeMapService.calculateTravelTime(
              { lat: driver.lat, lng: driver.lng },
              schoolLocation,
            );
            return { ...driver, eta };
          } catch (error) {
            console.error('Error calculating ETA for driver:', driver.driverId, error);
            return driver;
          }
        }),
      );

      setDrivers(driversWithETA);
      setIsCalculatingETAs(false);
    };

    if (drivers.length > 0 && !drivers[0].eta) {
      void calculateETAs();
    }
  }, [drivers]);

  const handleDriverSelect = (driver: DriverLocation) => {
    toast({
      title: 'Driver Selected',
      description: `Viewing details for ${driver.driverName} - ${driver.busNumber}`,
    });
  };

  const refreshETAs = () => {
    setDrivers((prevDrivers) => prevDrivers.map((driver) => ({ ...driver, eta: undefined })));
  };

  const activeDrivers = drivers.filter((d) => d.isActive);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Real-Time School Bus Tracking</h2>
        <p className="text-muted-foreground">
          Monitor all school buses and their estimated arrival times
        </p>
      </div>

      <AdminMapStats
        activeDrivers={activeDrivers}
        showOnlyActiveTrips={showOnlyActiveTrips}
      />

      <Tabs defaultValue="map" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="drivers">Driver Details</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          <AdminMapControls
            showOnlyActiveTrips={showOnlyActiveTrips}
            setShowOnlyActiveTrips={setShowOnlyActiveTrips}
            isLoadingTrips={isLoadingTrips}
            refreshETAs={refreshETAs}
            isCalculatingETAs={isCalculatingETAs}
          />

          <GoogleMap
            drivers={drivers}
            className="h-[600px] w-full"
            showDriverInfo={true}
            onDriverSelect={handleDriverSelect}
          />

          {fetchError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-700">Error loading live tracking data: {fetchError}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4">
          <AdminDriverList activeDrivers={activeDrivers} onDriverSelect={handleDriverSelect} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminMapView;
