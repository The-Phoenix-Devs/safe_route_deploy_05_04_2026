
/**
 * Utility functions for location-based calculations
 */

/**
 * Calculate the distance between two points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

/**
 * Convert degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Estimate travel time based on distance and average speed
 * @param distanceKm Distance in kilometers
 * @param speedKmh Average speed in kilometers per hour
 * @returns Estimated travel time in minutes
 */
export const estimateTravelTime = (
  distanceKm: number,
  speedKmh: number = 30
): number => {
  // Convert distance / speed to minutes
  return (distanceKm / speedKmh) * 60;
};

/**
 * Format minutes into a human-readable format
 * @param minutes Number of minutes
 * @returns Formatted time string (e.g., "15 mins" or "1 hr 15 mins")
 */
export const formatTravelTime = (minutes: number): string => {
  if (minutes < 1) {
    return "Less than a minute";
  }
  
  if (minutes < 60) {
    return `${Math.round(minutes)} mins`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${remainingMinutes} mins`;
};
