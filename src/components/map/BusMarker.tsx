
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Icon, Style } from 'ol/style';
import { fromLonLat } from 'ol/proj';
import { MAP_CONFIG } from './mapConfig';

export interface BusMarkerProps {
  id: string;
  busNumber: string;
  driverName: string;
  position: {
    longitude: number;
    latitude: number;
  };
  speed: number;
  timestamp: Date;
}

export const createBusMarker = (bus: BusMarkerProps): Feature => {
  try {
    // Create a point feature at bus location
    const feature = new Feature({
      geometry: new Point(fromLonLat([bus.position.longitude, bus.position.latitude])),
      name: bus.busNumber,
      busInfo: {
        busNumber: bus.busNumber,
        driverName: bus.driverName,
        speed: bus.speed,
        timestamp: bus.timestamp
      }
    });

    // Style the feature with a visible dot/circle for driver location
    feature.setStyle(new Style({
      image: new Icon({
        src: 'data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="8" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
            <circle cx="12" cy="12" r="4" fill="#ffffff"/>
          </svg>
        `),
        scale: 1.2,
        anchor: [0.5, 0.5],
      })
    }));

    return feature;
  } catch (error) {
    console.error('Error creating bus marker:', error);
    // Return a default feature if there's an error
    const defaultFeature = new Feature({
      geometry: new Point(fromLonLat([0, 0])),
      name: 'Error'
    });
    return defaultFeature;
  }
};
