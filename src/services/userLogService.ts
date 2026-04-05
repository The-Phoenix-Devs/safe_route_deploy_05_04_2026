import { supabase } from '@/integrations/supabase/client';
import { locationService } from './locationService';

export interface CreateUserLogParams {
  user_id: string;
  user_type: "driver" | "guardian" | "admin" | "guardian_admin";
  user_name: string;
  location?: string;
  ip_address?: string;
  device_info?: string;
}

export const logUserLogin = async (params: CreateUserLogParams) => {
  try {
    // Get user's IP address and location
    let ipAddress = params.ip_address;
    let location = params.location;
    let deviceInfo = params.device_info;

    // Try to get GPS location first (for mobile app)
    if (!location) {
      try {
        const gpsLocation = await locationService.getCurrentLocation();
        if (gpsLocation) {
          location = locationService.formatCoordinates(gpsLocation);
          console.log('GPS location captured:', location);
        }
      } catch (error) {
        console.log('GPS location not available, falling back to IP location');
      }
    }

    // If not provided, try to get IP and device info
    if (!ipAddress || !deviceInfo) {
      try {
        // Get device info (mobile app vs web)
        if (!deviceInfo) {
          try {
            deviceInfo = await locationService.getDeviceInfo();
          } catch (error) {
            deviceInfo = navigator.userAgent;
          }
        }

        // Get IP address from external service if not provided
        if (!ipAddress) {
          try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            ipAddress = data.ip;
          } catch (error) {
            console.error('Failed to get IP address:', error);
            ipAddress = 'Unknown';
          }
        }

        // Get location from IP if GPS location is not available
        if (!location && ipAddress !== 'Unknown') {
          try {
            const response = await fetch(`https://api.ipapi.com/api/${ipAddress}?access_key=free&format=1`);
            const data = await response.json();
            if (data.city) {
              location = `${data.city}, ${data.region_name}, ${data.country_name}`;
            }
          } catch (error) {
            console.log('Failed to get location from IP, trying alternative service');
            try {
              const response2 = await fetch(`http://ip-api.com/json/${ipAddress}`);
              const data2 = await response2.json();
              if (data2.status === 'success') {
                location = `${data2.city}, ${data2.regionName}, ${data2.country}`;
              }
            } catch (error2) {
              console.error('Failed to get location from alternative IP service:', error2);
              location = 'Unknown';
            }
          }
        }
      } catch (error) {
        console.error('Error getting user info:', error);
      }
    }

    // Insert into database
    const { error } = await supabase
      .from('user_logs')
      .insert({
        user_id: params.user_id,
        user_type: params.user_type,
        user_name: params.user_name,
        location: location || 'Unknown',
        ip_address: ipAddress || 'Unknown',
        device_info: deviceInfo || 'Unknown',
        login_time: new Date().toISOString()
      });

    if (error) {
      console.error('Database error logging user login:', error);
    } else {
      console.log('User login logged successfully to database');
    }
  } catch (error) {
    console.error('Failed to log user login:', error);
    // Don't throw error to prevent login failure
  }
};

/** Guardian “steps” / session pings — uses `activity_type` when migration has run. */
export const logGuardianActivity = async (params: {
  user_id: string;
  user_name: string;
  activity_type: string;
}) => {
  try {
    const { error } = await supabase.from("user_logs").insert({
      user_id: params.user_id,
      user_type: "guardian",
      user_name: params.user_name,
      activity_type: params.activity_type,
      login_time: new Date().toISOString(),
      location: "Unknown",
      ip_address: "Unknown",
      device_info:
        typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : "Unknown",
    });
    if (error) {
      console.warn("logGuardianActivity:", error.message);
    }
  } catch (e) {
    console.warn("logGuardianActivity failed:", e);
  }
};

export const getUserLogs = async (limit = 100) => {
  try {
    const { data, error } = await supabase
      .from('user_logs')
      .select('*')
      .order('login_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch user logs:', error);
    return [];
  }
};