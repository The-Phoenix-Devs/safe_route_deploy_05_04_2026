
import { supabase } from '@/integrations/supabase/client';

export interface LiveLocation {
  id: string;
  user_id: string;
  user_type: 'driver' | 'bus';
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp: string;
  bus_number?: string;
  driver_name?: string;
  is_active: boolean;
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  user_type: 'driver' | 'bus';
  bus_number?: string;
  driver_name?: string;
}

class LiveTrackingService {
  private watchId: number | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private lastKnownPosition: GeolocationPosition | null = null;

  private buildLocationUpdate(
    position: GeolocationPosition,
    userType: 'driver' | 'bus',
    busNumber?: string,
    driverName?: string,
  ): LocationUpdate {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      heading: position.coords.heading ?? undefined,
      speed: position.coords.speed ?? undefined,
      accuracy: position.coords.accuracy ?? undefined,
      user_type: userType,
      bus_number: busNumber,
      driver_name: driverName,
    };
  }

  /**
   * Push one fix to Supabase immediately, then watch for updates.
   * Pass `initialFix` when the UI already has a position (e.g. map watch) — getCurrentPosition
   * with maximumAge:0 often times out on mobile even though watchPosition already has coords.
   */
  async startTracking(
    userId: string,
    userType: 'driver' | 'bus',
    busNumber?: string,
    driverName?: string,
    options?: { initialFix?: GeolocationPosition },
  ): Promise<void> {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    this.stopTracking();

    const push = async (position: GeolocationPosition) => {
      await this.updateLocation(
        userId,
        this.buildLocationUpdate(position, userType, busNumber, driverName),
      );
    };

    const getOnce = (opts: PositionOptions) =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, opts);
      });

    if (options?.initialFix) {
      this.lastKnownPosition = options.initialFix;
      await push(options.initialFix);
    } else {
      let position: GeolocationPosition;
      try {
        position = await getOnce({
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 120000,
        });
      } catch {
        position = await getOnce({
          enableHighAccuracy: false,
          timeout: 30000,
          maximumAge: 300000,
        });
      }
      this.lastKnownPosition = position;
      await push(position);
    }

    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        this.lastKnownPosition = position;
        try {
          await push(position);
        } catch (error) {
          console.error('Error updating location:', error);
        }
      },
      (error) => {
        console.error('Geolocation watch error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      },
    );
  }

  // Update location in database
  private async updateLocation(userId: string, locationData: LocationUpdate): Promise<void> {
    const row = {
      user_id: userId,
      user_type: locationData.user_type,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      heading: locationData.heading,
      speed: locationData.speed,
      accuracy: locationData.accuracy,
      timestamp: new Date().toISOString(),
      bus_number: locationData.bus_number,
      driver_name: locationData.driver_name,
      is_active: true,
    };

    const { error } = await supabase.from('live_locations').upsert(row, { onConflict: 'user_id' });

    if (!error) return;

    const msg = error.message || '';
    const missingConflictTarget =
      msg.includes('ON CONFLICT') ||
      msg.includes('unique or exclusion constraint') ||
      msg.includes('42P10');

    if (missingConflictTarget) {
      const { error: delErr } = await supabase.from('live_locations').delete().eq('user_id', userId);
      if (delErr) {
        console.error('live_locations delete-before-insert failed:', delErr.message);
        throw delErr;
      }
      const { error: insErr } = await supabase.from('live_locations').insert(row);
      if (insErr) {
        console.error('live_locations insert failed:', insErr.message);
        throw insErr;
      }
      return;
    }

    console.error('live_locations upsert failed:', error.message, error);
    throw error;
  }

  // Stop tracking
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Set user as inactive
  async setInactive(userId: string): Promise<void> {
    const { error } = await supabase
      .from('live_locations')
      .update({ is_active: false })
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  }

  // Get all active locations (never throws — map UI should still load on RLS/network errors)
  async getActiveLocations(): Promise<LiveLocation[]> {
    const { data, error } = await supabase
      .from('live_locations')
      .select('*')
      .eq('is_active', true)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('getActiveLocations:', error.message);
      return [];
    }

    return (data || []).map(location => ({
      ...location,
      user_type: location.user_type as 'driver' | 'bus'
    }));
  }

  // Get active locations for buses that have started a trip
  async getActiveTripLocations(): Promise<LiveLocation[]> {
    // For now, return all active driver locations to show on the map
    // This can be enhanced later to only show drivers with active trips
    const { data, error } = await supabase
      .from('live_locations')
      .select('*')
      .eq('is_active', true)
      .eq('user_type', 'driver')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching active trip locations:', error);
      return [];
    }

    return (data || []).map(location => ({
      ...location,
      user_type: location.user_type as 'driver' | 'bus'
    }));
  }

  // Subscribe to real-time location updates (unique channel id avoids clashes when multiple hooks mounted)
  subscribeToLocationUpdates(callback: (locations: LiveLocation[]) => void) {
    const channelId = `live-locations-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'live_locations',
          },
          async () => {
            try {
              const locations = await this.getActiveLocations();
              callback(locations);
            } catch (e) {
              console.error('Realtime location refresh:', e);
            }
          },
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('live_locations realtime:', status);
          }
        });
    } catch (e) {
      console.error('Realtime subscribe failed:', e);
    }

    this.getActiveLocations()
      .then(callback)
      .catch((e) => {
        console.error('Initial live locations load:', e);
        callback([]);
      });

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (e) {
          console.warn('removeChannel:', e);
        }
      }
    };
  }
}

export const liveTrackingService = new LiveTrackingService();
