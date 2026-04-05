
import { useState, useEffect, useCallback } from 'react';
import { BusMarkerProps } from './BusMarker';
import { liveTrackingService } from '@/services/liveTrackingService';
import { supabase } from '@/integrations/supabase/client';

export const useMapData = () => {
  const [busLocations, setBusLocations] = useState<BusMarkerProps[]>([]);
  const [routes, setRoutes] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real-time driver locations from database
  useEffect(() => {
    const fetchMapData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch routes from database
        const { data: routesData, error: routesError } = await supabase
          .from('routes')
          .select('id, name')
          .order('name');

        if (routesError) {
          console.error('Error fetching routes:', routesError);
          // Use fallback routes
          setRoutes([
            { id: '1', name: 'North Route' },
            { id: '2', name: 'South Route' },
          ]);
        } else {
          setRoutes(routesData || []);
        }

        // Fetch active driver locations from database
        const liveLocations = await liveTrackingService.getActiveTripLocations();
        
        const driverBusLocations: BusMarkerProps[] = liveLocations
          .filter(location => location.user_type === 'driver' && location.is_active)
          .map(location => ({
            id: location.user_id,
            busNumber: location.bus_number || 'Unknown Bus',
            driverName: location.driver_name || 'Unknown Driver',
            position: {
              longitude: location.longitude,
              latitude: location.latitude
            },
            speed: location.speed || 0,
            timestamp: new Date(location.timestamp)
          }));

        setBusLocations(driverBusLocations);
        setIsLoading(false);

        const mapRowsToBuses = (rows: typeof liveLocations): BusMarkerProps[] =>
          rows
            .filter((location) => location.user_type === 'driver' && location.is_active)
            .map((location) => ({
              id: location.user_id,
              busNumber: location.bus_number || 'Unknown Bus',
              driverName: location.driver_name || 'Unknown Driver',
              position: {
                longitude: location.longitude,
                latitude: location.latitude,
              },
              speed: location.speed || 0,
              timestamp: new Date(location.timestamp),
            }));

        let unsubscribe: (() => void) | undefined;
        try {
          unsubscribe = liveTrackingService.subscribeToLocationUpdates((updatedLocations) => {
            setBusLocations(mapRowsToBuses(updatedLocations));
          });
        } catch (subErr) {
          console.error('Live tracking subscription failed:', subErr);
        }

        const poll = async () => {
          try {
            const rows = await liveTrackingService.getActiveTripLocations();
            setBusLocations(mapRowsToBuses(rows));
            setError(null);
          } catch (pollErr) {
            console.error('Map location poll failed:', pollErr);
          }
        };
        const pollId = window.setInterval(poll, 8000);

        return () => {
          window.clearInterval(pollId);
          if (unsubscribe) unsubscribe();
        };
      } catch (err) {
        console.error('Error fetching map data:', err);
        const msg =
          err instanceof Error ? err.message : 'Failed to load live tracking data.';
        setError(
          msg.includes('Failed to fetch') || msg.includes('Network')
            ? 'Failed to load live tracking data. Please check your connection.'
            : `Could not load the map: ${msg}`,
        );
        setIsLoading(false);
      }
    };

    const cleanupPromise = fetchMapData();

    return () => {
      void cleanupPromise.then((cleanup) => {
        if (cleanup) cleanup();
      });
    };
  }, []);

  // Function to simulate bus movement (for demo purposes)
  // In production, this would be replaced with real-time updates from Supabase
  const simulateBusMovement = useCallback(() => {
    setBusLocations(prev => prev.map(bus => ({
      ...bus,
      position: {
        longitude: bus.position.longitude + (Math.random() * 0.001 - 0.0005),
        latitude: bus.position.latitude + (Math.random() * 0.001 - 0.0005)
      },
      speed: Math.floor(Math.random() * 30) + 5,
      timestamp: new Date()
    })));
  }, []);

  return {
    busLocations,
    routes,
    error,
    isLoading,
    simulateBusMovement
  };
};
