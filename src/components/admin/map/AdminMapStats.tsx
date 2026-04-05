import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Users, Zap, Navigation } from 'lucide-react';
import type { DriverLocation, TravelTimeResult } from "@/services/mapTypes";

interface DriverWithETA extends DriverLocation {
  eta?: TravelTimeResult;
}

interface AdminMapStatsProps {
  activeDrivers: DriverWithETA[];
  showOnlyActiveTrips: boolean;
}

const AdminMapStats: React.FC<AdminMapStatsProps> = ({ 
  activeDrivers, 
  showOnlyActiveTrips 
}) => {
  const totalStudents = activeDrivers.length * 15; // Mock calculation

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">
                {showOnlyActiveTrips ? 'Active Trips' : 'Active Buses'}
              </p>
              <p className="text-2xl font-bold">{activeDrivers.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Students on Board</p>
              <p className="text-2xl font-bold">{totalStudents}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Avg ETA</p>
              <p className="text-2xl font-bold">
                {activeDrivers.length > 0 && activeDrivers[0]?.eta 
                  ? Math.round(activeDrivers.reduce((sum, d) => sum + (d.eta?.duration || 0), 0) / activeDrivers.length / 60) + 'm'
                  : '--'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">Last Update</p>
              <p className="text-2xl font-bold">
                {activeDrivers.length > 0 
                  ? new Date(Math.max(...activeDrivers.map(d => d.timestamp.getTime()))).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                  : '--'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMapStats;