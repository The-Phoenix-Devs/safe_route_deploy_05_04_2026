export interface LocationPoint {
  lat: number;
  lng: number;
}

export interface DriverLocation extends LocationPoint {
  driverId: string;
  driverName: string;
  busNumber: string;
  timestamp: Date;
  isActive: boolean;
}

export interface TravelTimeResult {
  duration: number;
  distance: number;
  formattedDuration: string;
  formattedDistance: string;
}
