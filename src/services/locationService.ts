import { Geolocation } from '@capacitor/geolocation';
import { Device } from '@capacitor/device';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

class LocationService {
  private locationPermissionGranted = false;

  // Check and request location permissions
  async requestLocationPermission(): Promise<boolean> {
    try {
      // Check current permission status
      const permissions = await Geolocation.checkPermissions();
      console.log('Location permission status:', permissions);

      if (permissions.location === 'granted') {
        this.locationPermissionGranted = true;
        return true;
      }

      // Request permission if not granted
      const permissionResult = await Geolocation.requestPermissions();
      console.log('Permission request result:', permissionResult);

      this.locationPermissionGranted = permissionResult.location === 'granted';
      return this.locationPermissionGranted;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  // Get current position
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      if (!this.locationPermissionGranted) {
        const permissionGranted = await this.requestLocationPermission();
        if (!permissionGranted) {
          throw new Error('Location permission not granted');
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  // Get device info for logging
  async getDeviceInfo(): Promise<string> {
    try {
      const info = await Device.getInfo();
      return `${info.manufacturer} ${info.model} (${info.platform} ${info.osVersion})`;
    } catch (error) {
      console.error('Error getting device info:', error);
      return 'Unknown Device';
    }
  }

  // Format coordinates as string for database storage
  formatCoordinates(location: LocationData): string {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  }

  // Initialize location services (call on app start)
  async initializeLocationServices(): Promise<void> {
    try {
      await this.requestLocationPermission();
      console.log('Location services initialized');
    } catch (error) {
      console.error('Failed to initialize location services:', error);
    }
  }
}

export const locationService = new LocationService();