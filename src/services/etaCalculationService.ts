import { supabase } from '@/integrations/supabase/client';

interface ETACalculation {
  studentId: string;
  estimatedArrivalTime: string;
  distanceKm: number;
  durationMinutes: number;
  lastUpdated: Date;
}

interface BusLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  heading?: number;
}

interface PickupLocation {
  latitude: number;
  longitude: number;
  address: string;
}

class ETACalculationService {
  private static instance: ETACalculationService;
  private cachedETAs: Map<string, ETACalculation> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  private constructor() {}

  static getInstance(): ETACalculationService {
    if (!ETACalculationService.instance) {
      ETACalculationService.instance = new ETACalculationService();
    }
    return ETACalculationService.instance;
  }

  // Calculate distance using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Calculate ETA based on current speed and distance
  private calculateETA(distance: number, speed: number, baseSpeed: number = 25): number {
    // Use actual speed if available and reasonable, otherwise use base speed
    const effectiveSpeed = (speed > 0 && speed <= 80) ? speed : baseSpeed;
    return (distance / effectiveSpeed) * 60; // Convert to minutes
  }

  // Get bus location for a specific student
  private async getBusLocationForStudent(studentId: string): Promise<BusLocation | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_student_driver_location', { student_id: studentId });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const location = data[0];
      return {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: location.last_updated,
        speed: undefined, // Speed not available in current schema
        heading: undefined // Heading not available in current schema
      };
    } catch (error) {
      console.error('Error getting bus location:', error);
      return null;
    }
  }

  // Get pickup location for a student
  private async getPickupLocation(studentId: string): Promise<PickupLocation | null> {
    try {
      const { data: student, error } = await supabase
        .from('students')
        .select('pickup_location_lat, pickup_location_lng, pickup_point')
        .eq('id', studentId)
        .single();

      if (error) throw error;
      if (!student.pickup_location_lat || !student.pickup_location_lng) return null;

      return {
        latitude: student.pickup_location_lat,
        longitude: student.pickup_location_lng,
        address: student.pickup_point
      };
    } catch (error) {
      console.error('Error getting pickup location:', error);
      return null;
    }
  }

  // Calculate ETA for a specific student
  async calculateETAForStudent(studentId: string): Promise<ETACalculation | null> {
    try {
      // Check cache first
      const cached = this.cachedETAs.get(studentId);
      if (cached && Date.now() - cached.lastUpdated.getTime() < this.CACHE_DURATION) {
        return cached;
      }

      // Get bus and pickup locations
      const [busLocation, pickupLocation] = await Promise.all([
        this.getBusLocationForStudent(studentId),
        this.getPickupLocation(studentId)
      ]);

      if (!busLocation || !pickupLocation) return null;

      // Calculate distance
      const distance = this.calculateDistance(
        busLocation.latitude,
        busLocation.longitude,
        pickupLocation.latitude,
        pickupLocation.longitude
      );

      // Check if bus is already at pickup point (within 100m)
      if (distance < 0.1) {
        const eta: ETACalculation = {
          studentId,
          estimatedArrivalTime: 'Arrived',
          distanceKm: distance,
          durationMinutes: 0,
          lastUpdated: new Date()
        };
        this.cachedETAs.set(studentId, eta);
        return eta;
      }

      // Calculate ETA in minutes
      const durationMinutes = this.calculateETA(distance, busLocation.speed || 0);
      
      // Calculate estimated arrival time
      const arrivalTime = new Date();
      arrivalTime.setMinutes(arrivalTime.getMinutes() + durationMinutes);

      const eta: ETACalculation = {
        studentId,
        estimatedArrivalTime: `${Math.round(durationMinutes)} min`,
        distanceKm: distance,
        durationMinutes: Math.round(durationMinutes),
        lastUpdated: new Date()
      };

      // Cache the result
      this.cachedETAs.set(studentId, eta);
      return eta;

    } catch (error) {
      console.error('Error calculating ETA:', error);
      return null;
    }
  }

  // Calculate ETA for multiple students (for guardians with multiple children)
  async calculateETAForStudents(studentIds: string[]): Promise<Map<string, ETACalculation>> {
    const results = new Map<string, ETACalculation>();

    const calculations = await Promise.allSettled(
      studentIds.map(id => this.calculateETAForStudent(id))
    );

    calculations.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        results.set(studentIds[index], result.value);
      }
    });

    return results;
  }

  // Start automatic ETA updates for a guardian
  startETAUpdates(studentIds: string[], onUpdate: (etas: Map<string, ETACalculation>) => void): void {
    this.stopETAUpdates(); // Clear any existing interval

    this.updateInterval = setInterval(async () => {
      const etas = await this.calculateETAForStudents(studentIds);
      onUpdate(etas);
    }, 15000); // Update every 15 seconds

    // Initial calculation
    this.calculateETAForStudents(studentIds).then(onUpdate);
  }

  // Stop automatic ETA updates
  stopETAUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Get enhanced ETA information with route details
  async getEnhancedETA(studentId: string): Promise<{
    eta: ETACalculation | null;
    busStatus: 'approaching' | 'arrived' | 'departed' | 'inactive';
    nextStop?: string;
  }> {
    const eta = await this.calculateETAForStudent(studentId);
    
    let busStatus: 'approaching' | 'arrived' | 'departed' | 'inactive' = 'inactive';
    
    if (eta) {
      if (eta.estimatedArrivalTime === 'Arrived') {
        busStatus = 'arrived';
      } else if (eta.durationMinutes <= 5) {
        busStatus = 'approaching';
      } else {
        busStatus = 'approaching';
      }
    }

    return {
      eta,
      busStatus,
      nextStop: eta ? 'Your pickup point' : undefined
    };
  }

  // Clear cache for specific student
  clearCache(studentId?: string): void {
    if (studentId) {
      this.cachedETAs.delete(studentId);
    } else {
      this.cachedETAs.clear();
    }
  }

  // Get cache statistics
  getCacheStats(): { 
    totalCached: number; 
    avgAge: number; 
    oldestEntry: number;
  } {
    const now = Date.now();
    const entries = Array.from(this.cachedETAs.values());
    
    if (entries.length === 0) {
      return { totalCached: 0, avgAge: 0, oldestEntry: 0 };
    }

    const ages = entries.map(eta => now - eta.lastUpdated.getTime());
    const avgAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;
    const oldestEntry = Math.max(...ages);

    return {
      totalCached: entries.length,
      avgAge: Math.round(avgAge / 1000), // Convert to seconds
      oldestEntry: Math.round(oldestEntry / 1000) // Convert to seconds
    };
  }
}

export const etaCalculationService = ETACalculationService.getInstance();
export type { ETACalculation, BusLocation, PickupLocation };