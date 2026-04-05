import React from 'react';
import { Button } from '@/components/ui/button';

interface AdminMapControlsProps {
  showOnlyActiveTrips: boolean;
  setShowOnlyActiveTrips: (show: boolean) => void;
  isLoadingTrips: boolean;
  refreshETAs: () => void;
  isCalculatingETAs: boolean;
}

const AdminMapControls: React.FC<AdminMapControlsProps> = ({
  showOnlyActiveTrips,
  setShowOnlyActiveTrips,
  isLoadingTrips,
  refreshETAs,
  isCalculatingETAs
}) => {
  return (
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-semibold">Live Location Tracking</h3>
      <div className="flex gap-2">
        <Button 
          onClick={() => setShowOnlyActiveTrips(!showOnlyActiveTrips)} 
          variant={showOnlyActiveTrips ? "default" : "outline"} 
          size="sm"
          disabled={isLoadingTrips}
        >
          {showOnlyActiveTrips ? 'Show All Buses' : 'Show Only Active Trips'}
        </Button>
        <Button onClick={refreshETAs} variant="outline" size="sm" disabled={isCalculatingETAs}>
          {isCalculatingETAs ? 'Calculating...' : 'Refresh ETAs'}
        </Button>
      </div>
    </div>
  );
};

export default AdminMapControls;