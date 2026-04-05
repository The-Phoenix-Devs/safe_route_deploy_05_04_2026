
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { CardTitle } from '@/components/ui/card';
import { Map, Satellite } from 'lucide-react';

interface MapControlsProps {
  routes: { id: string; name: string }[];
  selectedRoute: string;
  onRouteChange: (value: string) => void;
  onResetView: () => void;
  mapType?: 'street' | 'satellite';
  onMapTypeChange?: (type: 'street' | 'satellite') => void;
}

const MapControls: React.FC<MapControlsProps> = ({ 
  routes, 
  selectedRoute, 
  onRouteChange, 
  onResetView,
  mapType = 'street',
  onMapTypeChange
}) => {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <CardTitle>Live Bus Tracking</CardTitle>
        <div className="flex items-center space-x-2">
          {/* Map Type Switcher */}
          {onMapTypeChange && (
            <div className="flex rounded-md border border-input">
              <Button
                variant={mapType === 'street' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onMapTypeChange('street')}
                className="rounded-r-none"
              >
                <Map className="h-4 w-4 mr-1" />
                Street
              </Button>
              <Button
                variant={mapType === 'satellite' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onMapTypeChange('satellite')}
                className="rounded-l-none"
              >
                <Satellite className="h-4 w-4 mr-1" />
                Satellite
              </Button>
            </div>
          )}
          
          {/* Route Selector */}
          <Select 
            value={selectedRoute} 
            onValueChange={onRouteChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All routes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All routes</SelectItem>
              {routes.map(route => (
                <SelectItem key={route.id} value={route.id}>
                  {route.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={onResetView}>
            Reset View
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MapControls;
