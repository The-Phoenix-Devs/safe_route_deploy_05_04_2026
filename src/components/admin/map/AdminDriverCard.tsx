import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin } from 'lucide-react';
import type { DriverLocation, TravelTimeResult } from "@/services/mapTypes";

interface DriverWithETA extends DriverLocation {
  eta?: TravelTimeResult;
}

interface AdminDriverCardProps {
  driver: DriverWithETA;
  onDriverSelect: (driver: DriverLocation) => void;
}

const AdminDriverCard: React.FC<AdminDriverCardProps> = ({ 
  driver, 
  onDriverSelect 
}) => {
  return (
    <Card 
      key={driver.driverId} 
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onDriverSelect(driver)}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{driver.driverName}</span>
          <Badge variant={driver.isActive ? "default" : "secondary"}>
            {driver.isActive ? "Active" : "Inactive"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span className="text-sm">Bus: {driver.busNumber}</span>
        </div>

        {driver.eta && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">ETA to School</span>
            </div>
            <p className="text-lg font-bold text-blue-800">{driver.eta.formattedDuration}</p>
            <p className="text-xs text-blue-600">{driver.eta.formattedDistance}</p>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>Location: {driver.lat.toFixed(4)}, {driver.lng.toFixed(4)}</p>
          <p>Last update: {driver.timestamp.toLocaleTimeString()}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDriverCard;