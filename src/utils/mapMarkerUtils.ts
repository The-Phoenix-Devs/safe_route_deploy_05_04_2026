import Feature from 'ol/Feature';
import { BRAND_LOGO_SRC } from "@/lib/brandLogo";
import Point from 'ol/geom/Point';
import { Style, Icon } from 'ol/style';
import { fromLonLat } from 'ol/proj';

/**
 * Creates a bus marker feature for OpenLayers map
 */
export const createBusMarker = (
  longitude: number, 
  latitude: number, 
  name: string
): Feature => {
  const location = fromLonLat([longitude, latitude]);
  
  const feature = new Feature({
    geometry: new Point(location),
    name: name
  });
  
  feature.setStyle(
    new Style({
      image: new Icon({
        src: '/bus-icon.svg',
        scale: 1.5,
        anchor: [0.5, 0.5]
      })
    })
  );
  
  return feature;
};

/**
 * Creates a driver marker feature for OpenLayers map
 */
export const createDriverMarker = (
  longitude: number, 
  latitude: number, 
  name: string
): Feature => {
  const location = fromLonLat([longitude, latitude]);
  
  const feature = new Feature({
    geometry: new Point(location),
    name: name
  });
  
  feature.setStyle(
    new Style({
      image: new Icon({
        src: BRAND_LOGO_SRC,
        scale: 0.5,
        anchor: [0.5, 0.5]
      })
    })
  );
  
  return feature;
};

/**
 * Calculate appropriate zoom level based on distance between points
 */
export const calculateZoomLevel = (
  lon1: number, 
  lat1: number, 
  lon2: number, 
  lat2: number
): number => {
  const distance = Math.sqrt(
    Math.pow(lon1 - lon2, 2) + 
    Math.pow(lat1 - lat2, 2)
  );
  
  // Adjust zoom based on distance
  if (distance < 0.005) return 16;
  if (distance < 0.01) return 15;
  if (distance < 0.05) return 14;
  if (distance < 0.1) return 13;
  return 12;
};
