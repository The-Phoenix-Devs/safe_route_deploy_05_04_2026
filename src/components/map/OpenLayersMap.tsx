
import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';
import Feature from 'ol/Feature';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { BusMarkerProps, createBusMarker } from './BusMarker';
import { MAP_CONFIG } from './mapConfig';

interface OpenLayersMapProps {
  busLocations: BusMarkerProps[];
  selectedBusId?: string;
  className?: string;
  mapType?: 'street' | 'satellite';
}

const OpenLayersMap: React.FC<OpenLayersMapProps> = ({ 
  busLocations, 
  selectedBusId,
  className = "absolute inset-0",
  mapType = 'street'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObject = useRef<Map | null>(null);
  const markersRef = useRef<{ [key: string]: Feature }>({});
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const baseLayerRef = useRef<TileLayer<any> | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize OpenLayers map with error handling
  useEffect(() => {
    if (!mapRef.current || mapObject.current) return;

    try {
      console.log('Initializing OpenLayers map');
      
      // Create vector source for bus markers
      const vectorSource = new VectorSource();
      vectorSourceRef.current = vectorSource;

      // Create vector layer for bus markers
      const vectorLayer = new VectorLayer({
        source: vectorSource
      });

      // Create base layer based on map type
      const createBaseLayer = (type: 'street' | 'satellite') => {
        if (type === 'satellite') {
          // Using Esri World Imagery for satellite view
          return new TileLayer({
            source: new XYZ({
              url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
              attributions: '© Esri',
              crossOrigin: 'anonymous'
            })
          });
        } else {
          // Default street map
          return new TileLayer({
            source: new OSM({
              attributions: '',
              url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
              wrapX: false
            })
          });
        }
      };

      const baseLayer = createBaseLayer(mapType);
      baseLayerRef.current = baseLayer;

      // Create OpenLayers map
      const mapInstance = new Map({
        target: mapRef.current,
        layers: [
          baseLayer,
          // Vector layer for markers
          vectorLayer
        ],
        view: new View({
          center: fromLonLat(MAP_CONFIG.defaultCenter), 
          zoom: MAP_CONFIG.defaultZoom,
          minZoom: MAP_CONFIG.minZoom,
          maxZoom: MAP_CONFIG.maxZoom
        }),
        controls: defaultControls({
          attribution: false,
          zoom: true
        })
      });
      
      // Add standard controls
      // mapInstance.addControl(new ol.control.Zoom());
      // mapInstance.addControl(new ol.control.Attribution());

      mapObject.current = mapInstance;
      
      // Force a resize check to make sure map renders properly
      setTimeout(() => {
        if (mapObject.current) {
          mapObject.current.updateSize();
          console.log('Map size updated');
        }
      }, 100);

      setMapLoaded(true);
      console.log('Map initialization successful');
      
    } catch (err) {
      console.error('Error initializing map:', err);
    }

    return () => {
      if (mapObject.current) {
        console.log('Cleaning up map instance');
        mapObject.current.setTarget(undefined);
        mapObject.current = null;
      }
    };
  }, []);

  // Update base layer when mapType changes
  useEffect(() => {
    if (!mapObject.current || !baseLayerRef.current) return;

    try {
      console.log('Switching map type to:', mapType);
      
      const createBaseLayer = (type: 'street' | 'satellite') => {
        if (type === 'satellite') {
          return new TileLayer({
            source: new XYZ({
              url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
              attributions: '© Esri',
              crossOrigin: 'anonymous'
            })
          });
        } else {
          return new TileLayer({
            source: new OSM({
              attributions: '',
              url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
              wrapX: false
            })
          });
        }
      };

      // Remove old base layer
      mapObject.current.removeLayer(baseLayerRef.current);
      
      // Add new base layer
      const newBaseLayer = createBaseLayer(mapType);
      mapObject.current.getLayers().insertAt(0, newBaseLayer);
      baseLayerRef.current = newBaseLayer;

      console.log('Map type switched successfully');
    } catch (err) {
      console.error('Error switching map type:', err);
    }
  }, [mapType]);

  // Update bus markers when locations change or map loads
  useEffect(() => {
    if (!mapLoaded || !vectorSourceRef.current || !mapObject.current) {
      console.log('Map not ready for markers yet, skipping update');
      return;
    }

    try {
      console.log('Updating bus markers on map');
      // Clear existing features
      vectorSourceRef.current.clear();
      markersRef.current = {};

      // Filter buses based on selected bus
      const filteredBuses = selectedBusId && selectedBusId !== 'all' 
        ? busLocations.filter(bus => bus.busNumber === selectedBusId)
        : busLocations;

      console.log('Adding markers for buses:', filteredBuses);
      
      // Add bus markers
      filteredBuses.forEach(bus => {
        const feature = createBusMarker(bus);
        vectorSourceRef.current?.addFeature(feature);
        markersRef.current[bus.id] = feature;
      });

      // Fit map view to show all buses if we have locations
      if (filteredBuses.length > 0 && mapObject.current) {
        const view = mapObject.current.getView();
        if (filteredBuses.length === 1) {
          // If only one bus, center on it with closer zoom
          const bus = filteredBuses[0];
          view.animate({
            center: fromLonLat([bus.position.longitude, bus.position.latitude]),
            zoom: 14,
            duration: MAP_CONFIG.animationDuration
          });
        } else if (vectorSourceRef.current.getFeatures().length > 0) {
          // Calculate extent to fit all buses
          const extent = vectorSourceRef.current.getExtent();
          // Check if extent is valid (not empty)
          if (extent && extent.some(val => val !== Infinity && val !== -Infinity)) {
            mapObject.current.getView().fit(extent, {
              padding: [50, 50, 50, 50],
              maxZoom: 15,
              duration: MAP_CONFIG.animationDuration
            });
          }
        }
      }
      
      // Force render update
      mapObject.current.updateSize();
    } catch (err) {
      console.error('Error updating bus markers:', err);
    }
  }, [busLocations, mapLoaded, selectedBusId]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (mapObject.current) {
        console.log('Window resized, updating map size');
        mapObject.current.updateSize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Reset map view
  const resetView = () => {
    if (!mapObject.current) return;
    
    mapObject.current.getView().animate({
      center: fromLonLat(MAP_CONFIG.defaultCenter),
      zoom: MAP_CONFIG.defaultZoom,
      duration: MAP_CONFIG.animationDuration
    });
  };

  return (
    <div ref={mapRef} className={className} style={{ minHeight: '400px' }} />
  );
};

export default OpenLayersMap;
