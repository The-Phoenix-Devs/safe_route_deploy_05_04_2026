
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Route } from "lucide-react";

interface TripData {
  route: string;
  students: number;
  stops: number;
  estimatedDuration: string;
  nextStop: string;
  etaNextStop: string;
}

interface TripInfoProps {
  tripData: TripData;
}

const TripInfo: React.FC<TripInfoProps> = ({ tripData }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Trip Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Current Route</p>
            <p className="font-medium flex items-center">
              <Route className="mr-2 h-4 w-4" /> {tripData.route}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="font-medium">{tripData.students}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Stops</p>
              <p className="font-medium">{tripData.stops}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Next Stop</p>
            <p className="font-medium">{tripData.nextStop}</p>
            <p className="text-sm text-sishu-primary">ETA: {tripData.etaNextStop}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TripInfo;
