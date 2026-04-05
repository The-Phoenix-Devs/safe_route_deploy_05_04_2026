import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import type { DriverLocation, TravelTimeResult } from "@/services/mapTypes";
import AdminDriverCard from './AdminDriverCard';

interface DriverWithETA extends DriverLocation {
  eta?: TravelTimeResult;
}

interface AdminDriverListProps {
  activeDrivers: DriverWithETA[];
  onDriverSelect: (driver: DriverLocation) => void;
}

const AdminDriverList: React.FC<AdminDriverListProps> = ({ 
  activeDrivers, 
  onDriverSelect 
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Driver Details & ETAs</h3>
        <Badge variant="secondary">{activeDrivers.length} Active</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeDrivers.map((driver) => (
          <AdminDriverCard
            key={driver.driverId}
            driver={driver}
            onDriverSelect={onDriverSelect}
          />
        ))}
      </div>

      {activeDrivers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Active Drivers</h3>
            <p className="text-gray-500">No drivers are currently tracking their location.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDriverList;