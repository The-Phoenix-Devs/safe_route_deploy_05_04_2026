
import React from 'react';
import { BusMarkerProps } from './BusMarker';

interface BusInfoPanelProps {
  buses: BusMarkerProps[];
  selectedBusId?: string;
}

const BusInfoPanel: React.FC<BusInfoPanelProps> = ({ buses, selectedBusId }) => {
  const filteredBuses = !selectedBusId || selectedBusId === 'all' 
    ? buses 
    : buses.filter(bus => bus.busNumber === selectedBusId);
    
  return (
    <div className="absolute bottom-4 left-4 bg-white p-3 rounded-md shadow-md text-sm">
      <h3 className="font-bold mb-1">Active Buses</h3>
      <ul className="space-y-1">
        {filteredBuses.map(bus => (
          <li key={bus.id} className="flex items-center">
            <span className="h-3 w-3 bg-green-500 rounded-full mr-2"></span>
            {bus.busNumber} - {bus.driverName}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BusInfoPanel;
