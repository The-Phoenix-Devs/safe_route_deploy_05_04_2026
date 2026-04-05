import { supabase } from '@/integrations/supabase/client';
import { auth } from '@/config/firebase';
import { FirebaseNotificationService } from '@/lib/firebaseMessaging';
import { clearGuardianPushTokenRow } from '@/services/guardianPushService';

/**
 * Database Integration Service
 * Handles coordination between Supabase (primary) and Firebase (supplementary) databases
 */

export interface IntegratedUser {
  id: string;
  firebase_uid: string;
  email: string;
  username: string;
  user_type: 'admin' | 'driver' | 'guardian';
  mobile_number?: string;
  fcm_token?: string;
}

export class DatabaseIntegrationService {
  private static instance: DatabaseIntegrationService;
  private notificationService: FirebaseNotificationService;

  private constructor() {
    this.notificationService = FirebaseNotificationService.getInstance();
  }

  static getInstance(): DatabaseIntegrationService {
    if (!DatabaseIntegrationService.instance) {
      DatabaseIntegrationService.instance = new DatabaseIntegrationService();
    }
    return DatabaseIntegrationService.instance;
  }

  /**
   * Sync user profile between Supabase and Firebase
   */
  async syncUserProfile(userData: Partial<IntegratedUser>): Promise<IntegratedUser> {
    try {
      console.log('Syncing user profile:', userData);

      // Update Supabase profile
      const { data: supabaseProfile, error: supabaseError } = await supabase
        .from('profiles')
        .upsert({
          firebase_uid: userData.firebase_uid,
          email: userData.email,
          username: userData.username,
          user_type: userData.user_type,
          mobile_number: userData.mobile_number,
          fcm_token: userData.fcm_token,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (supabaseError) {
        console.error('Supabase sync error:', supabaseError);
        throw new Error(`Failed to sync with Supabase: ${supabaseError.message}`);
      }

      console.log('Profile synced successfully:', supabaseProfile);
      return supabaseProfile as IntegratedUser;
    } catch (error) {
      console.error('Error syncing user profile:', error);
      throw error;
    }
  }

  /**
   * Initialize FCM token for notifications
   */
  async initializeFCMToken(userId: string): Promise<void> {
    try {
      const token = await this.notificationService.requestPermission();
      if (token) {
        await supabase
          .from('profiles')
          .update({ fcm_token: token })
          .eq('id', userId);
        console.log('FCM token updated for user:', userId);
      }
    } catch (error) {
      console.error('Error initializing FCM token:', error);
    }
  }

  /**
   * Get live location data with real-time updates
   */
  async getLiveLocationWithUpdates(userId: string, userType: string) {
    const { data, error } = await supabase
      .from('live_locations')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .eq('is_active', true)
      .order('timestamp', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching live location:', error);
      return null;
    }

    return data?.[0] || null;
  }

  /**
   * Update live location in Supabase
   */
  async updateLiveLocation(locationData: {
    user_id: string;
    user_type: string;
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    accuracy?: number;
    driver_name?: string;
    bus_number?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('live_locations')
        .upsert({
          ...locationData,
          timestamp: new Date().toISOString(),
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating live location:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateLiveLocation:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time location updates
   */
  subscribeToLocationUpdates(callback: (payload: any) => void) {
    const channel = supabase
      .channel('live-locations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_locations'
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Log pickup/drop events
   */
  async logPickupDropEvent(eventData: {
    student_id: string;
    driver_id: string;
    event_type: 'pickup' | 'drop';
    location_lat?: number;
    location_lng?: number;
    location_name?: string;
    bus_number?: string;
    notes?: string;
  }) {
    try {
      const { data, error } = await supabase.rpc('driver_log_pickup_drop', {
        p_student_id: eventData.student_id,
        p_driver_id: eventData.driver_id,
        p_event_type: eventData.event_type,
        p_bus_number: eventData.bus_number ?? null,
        p_location_name: eventData.location_name ?? null,
        p_location_lat: eventData.location_lat ?? null,
        p_location_lng: eventData.location_lng ?? null,
        p_notes: eventData.notes ?? null,
      });

      if (error) {
        console.error('Error logging pickup/drop event:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in logPickupDropEvent:', error);
      throw error;
    }
  }

  /**
   * Clear user session and location data
   */
  async clearUserSession(userId: string) {
    try {
      // Deactivate live location
      await supabase
        .from('live_locations')
        .update({ is_active: false })
        .eq('user_id', userId);

      // Clear FCM token
      await supabase
        .from('profiles')
        .update({ fcm_token: null })
        .eq('id', userId);

      await clearGuardianPushTokenRow(userId);

      console.log('User session cleared for:', userId);
    } catch (error) {
      console.error('Error clearing user session:', error);
    }
  }

  /**
   * Health check for database connections
   */
  async healthCheck() {
    try {
      // Check Supabase connection
      const { data: supabaseHealth } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      // Check Firebase auth
      const firebaseHealth = !!auth.currentUser;

      return {
        supabase: !!supabaseHealth,
        firebase: firebaseHealth,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        supabase: false,
        firebase: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
export const databaseIntegrationService = DatabaseIntegrationService.getInstance();