import { supabase } from '@/integrations/supabase/client';
import { sendStudentActionNotification } from './notificationService';

interface GeofenceZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  type: 'pickup' | 'school' | 'custom';
}

interface PickupPoint {
  student_id: string;
  student_name: string;
  guardian_name: string;
  guardian_mobile: string;
  pickup_point: string;
  pickup_location_lat: number;
  pickup_location_lng: number;
  bus_number: string;
  driver_name: string;
}

class GeofenceService {
  private static instance: GeofenceService;
  private watchId: number | null = null;
  private activeGeofences: GeofenceZone[] = [];
  private pickupPoints: PickupPoint[] = [];
  private lastNotifiedZones: Set<string> = new Set();
  private isMonitoring = false;

  private constructor() {}

  static getInstance(): GeofenceService {
    if (!GeofenceService.instance) {
      GeofenceService.instance = new GeofenceService();
    }
    return GeofenceService.instance;
  }

  // Calculate distance between two points using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Load pickup points for current driver
  private async loadPickupPoints(driverId: string): Promise<void> {
    try {
      const { data: students, error } = await supabase
        .from('students')
        .select(`
          id,
          name,
          guardian_name,
          guardian_mobile,
          pickup_point,
          pickup_location_lat,
          pickup_location_lng,
          bus_number,
          drivers!inner(name)
        `)
        .eq('driver_id', driverId)
        .not('pickup_location_lat', 'is', null)
        .not('pickup_location_lng', 'is', null);

      if (error) throw error;

      this.pickupPoints =
        students?.map((student) => {
          const d = student.drivers as { name?: string } | { name?: string }[] | null;
          const driver = Array.isArray(d) ? d[0] : d;
          return {
            student_id: student.id,
            student_name: student.name,
            guardian_name: student.guardian_name,
            guardian_mobile: student.guardian_mobile || "",
            pickup_point: student.pickup_point,
            pickup_location_lat: student.pickup_location_lat,
            pickup_location_lng: student.pickup_location_lng,
            bus_number: student.bus_number || "",
            driver_name: driver?.name ?? "",
          };
        }) || [];

      // Create geofences around pickup points
      this.activeGeofences = this.pickupPoints.map(point => ({
        id: `pickup_${point.student_id}`,
        name: `${point.student_name} - ${point.pickup_point}`,
        latitude: point.pickup_location_lat,
        longitude: point.pickup_location_lng,
        radius: 100, // 100 meters radius
        type: 'pickup' as const
      }));

      console.log(`Loaded ${this.pickupPoints.length} pickup points for geofencing`);
    } catch (error) {
      console.error('Error loading pickup points:', error);
    }
  }

  // Check if driver is entering or leaving geofence zones
  private checkGeofences(currentLat: number, currentLng: number): void {
    this.activeGeofences.forEach(geofence => {
      const distance = this.calculateDistance(
        currentLat, 
        currentLng, 
        geofence.latitude, 
        geofence.longitude
      );

      const isInsideZone = distance <= geofence.radius;
      const wasNotified = this.lastNotifiedZones.has(geofence.id);

      if (isInsideZone && !wasNotified) {
        // Entering geofence - send arrival notification
        this.handleGeofenceEntry(geofence);
        this.lastNotifiedZones.add(geofence.id);
      } else if (!isInsideZone && wasNotified) {
        // Leaving geofence - send departure notification
        this.handleGeofenceExit(geofence);
        this.lastNotifiedZones.delete(geofence.id);
      }
    });
  }

  // Handle geofence entry (arrival)
  private handleGeofenceEntry(geofence: GeofenceZone): void {
    const pickupPoint = this.pickupPoints.find(p => `pickup_${p.student_id}` === geofence.id);
    if (!pickupPoint) return;

    console.log(`Bus arrived at pickup point: ${geofence.name}`);
    
    // Send notification to guardian
    sendStudentActionNotification({
      student_name: pickupPoint.student_name,
      guardian_name: pickupPoint.guardian_name,
      guardian_mobile: pickupPoint.guardian_mobile,
      action: 'pickup',
      time: new Date().toLocaleString(),
      bus_number: pickupPoint.bus_number,
      driver_name: pickupPoint.driver_name,
      pickup_point: pickupPoint.pickup_point
    });
  }

  // Handle geofence exit (departure)
  private handleGeofenceExit(geofence: GeofenceZone): void {
    const pickupPoint = this.pickupPoints.find(p => `pickup_${p.student_id}` === geofence.id);
    if (!pickupPoint) return;

    console.log(`Bus departed from pickup point: ${geofence.name}`);
    
    // Send notification to guardian about departure
    sendStudentActionNotification({
      student_name: pickupPoint.student_name,
      guardian_name: pickupPoint.guardian_name,
      guardian_mobile: pickupPoint.guardian_mobile,
      action: 'drop',
      time: new Date().toLocaleString(),
      bus_number: pickupPoint.bus_number,
      driver_name: pickupPoint.driver_name,
      pickup_point: pickupPoint.pickup_point
    });
  }

  /**
   * @returns true if monitoring is active after this call (including already-running).
   * false when there are no pickup coordinates — caller must not show a “started” success toast.
   */
  async startMonitoring(driverId: string): Promise<boolean> {
    if (this.isMonitoring) {
      return true;
    }

    await this.loadPickupPoints(driverId);

    if (this.pickupPoints.length === 0) {
      console.log('No pickup points with coordinates found - skipping geofence monitoring');
      return false;
    }

    if (navigator.geolocation) {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.checkGeofences(
            position.coords.latitude,
            position.coords.longitude
          );
        },
        (error) => {
          console.error('Geofence location error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );

      this.isMonitoring = true;
      console.log('Geofence monitoring started');
      return true;
    }

    throw new Error('Geolocation not supported');
  }

  // Stop geofence monitoring
  stopMonitoring(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    this.isMonitoring = false;
    this.lastNotifiedZones.clear();
    this.activeGeofences = [];
    this.pickupPoints = [];
    
    console.log('Geofence monitoring stopped');
  }

  // Add custom geofence zone (for school zones, etc.)
  addCustomGeofence(zone: Omit<GeofenceZone, 'id'>): string {
    const id = `custom_${Date.now()}`;
    this.activeGeofences.push({ ...zone, id });
    return id;
  }

  // Remove geofence zone
  removeGeofence(zoneId: string): void {
    this.activeGeofences = this.activeGeofences.filter(zone => zone.id !== zoneId);
    this.lastNotifiedZones.delete(zoneId);
  }

  // Get current monitoring status
  getStatus(): { isMonitoring: boolean; activeZones: number; pickupPoints: number } {
    return {
      isMonitoring: this.isMonitoring,
      activeZones: this.activeGeofences.length,
      pickupPoints: this.pickupPoints.length
    };
  }
}

export const geofenceService = GeofenceService.getInstance();
export type { GeofenceZone, PickupPoint };