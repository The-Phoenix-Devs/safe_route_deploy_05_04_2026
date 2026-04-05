
import { useState, useEffect, useCallback } from 'react';
import { liveTrackingService, LiveLocation } from '@/services/liveTrackingService';
import { useToast } from '@/hooks/use-toast';

export const useLiveTracking = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [locations, setLocations] = useState<LiveLocation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Start tracking for current user
  const startTracking = useCallback(async (
    userId: string, 
    userType: 'driver' | 'bus', 
    busNumber?: string, 
    driverName?: string
  ) => {
    try {
      setError(null);
      await liveTrackingService.startTracking(userId, userType, busNumber, driverName);
      setIsTracking(true);
      
      toast({
        title: "Location tracking started",
        description: "Your location is now being shared in real-time",
      });
    } catch (err: any) {
      setError(err.message);
      setIsTracking(false);
      
      toast({
        title: "Location tracking failed",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Stop tracking
  const stopTracking = useCallback(async (userId: string) => {
    try {
      liveTrackingService.stopTracking();
      await liveTrackingService.setInactive(userId);
      setIsTracking(false);
      
      toast({
        title: "Location tracking stopped",
        description: "Your location is no longer being shared",
      });
    } catch (err: any) {
      setError(err.message);
      
      toast({
        title: "Error stopping tracking",
        description: err.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  // Realtime + polling: admin map used to depend only on locations.length, so it stayed empty
  // if the first fetch ran before any driver wrote a row or if Realtime failed for the anon client.
  useEffect(() => {
    const unsubscribe = liveTrackingService.subscribeToLocationUpdates((newLocations) => {
      setLocations(newLocations);
    });

    const poll = async () => {
      try {
        const rows = await liveTrackingService.getActiveLocations();
        setLocations(rows);
        setError(null);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Poll failed';
        setError(msg);
      }
    };

    const interval = window.setInterval(poll, 8000);
    return () => {
      window.clearInterval(interval);
      unsubscribe();
    };
  }, []);

  return {
    isTracking,
    locations,
    error,
    startTracking,
    stopTracking
  };
};
