
/**
 * Map configuration settings
 * OpenStreetMap doesn't require an API key, which is why we're using it
 * For production use with high traffic, consider setting up a dedicated tile server
 */

export const MAP_CONFIG = {
  // Default center coordinates (can be overridden when rendering the map)
  defaultCenter: [87.773584, 22.783014], // Sishu Tirtha School Location
  defaultZoom: 12,
  maxZoom: 18,
  minZoom: 2,
  
  // Map styling and appearance
  attribution: '© OpenStreetMap contributors',
  
  // Bus marker configuration
  busMarkerScale: 0.5,
  busIconPath: '/bus-icon.svg',
  
  // Animation settings
  animationDuration: 1000,
  
  // Update intervals (in milliseconds)
  locationRefreshInterval: 3000, // How often to refresh bus locations
};

// If you need to use a different map provider in the future that requires an API key:
// export const MAP_API_KEY = process.env.REACT_APP_MAP_API_KEY || 'your-default-key';
