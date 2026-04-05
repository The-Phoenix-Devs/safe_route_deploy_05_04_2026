import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { geofenceService } from '@/services/geofenceService';
import { useToast } from '@/hooks/use-toast';

interface GeofenceMonitorProps {
  driverId: string;
  isActive: boolean;
}

const GeofenceMonitor: React.FC<GeofenceMonitorProps> = ({ driverId, isActive }) => {
  const [monitoringStatus, setMonitoringStatus] = useState({
    isMonitoring: false,
    activeZones: 0,
    pickupPoints: 0
  });
  const { toast } = useToast();

  // Update monitoring status
  const updateStatus = () => {
    setMonitoringStatus(geofenceService.getStatus());
  };

  const lastTripActiveRef = useRef(false);

  // Drive start/stop from trip flag only; read service state here (not React) to avoid stale closures.
  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      const svcOn = geofenceService.getStatus().isMonitoring;

      if (isActive && !svcOn) {
        try {
          const started = await geofenceService.startMonitoring(driverId);
          if (cancelled) return;
          updateStatus();
          if (started) {
            toast({
              title: 'Pickup point monitoring on',
              description:
                'Guardians can get alerts when you approach stops with map coordinates set.',
            });
          } else if (!lastTripActiveRef.current) {
            toast({
              title: 'Trip started — pickup alerts off',
              description:
                'No students have pickup latitude/longitude in the admin panel. Add coordinates to enable automatic pickup alerts.',
              variant: 'default',
            });
          }
        } catch (error) {
          console.error('Failed to start geofence monitoring:', error);
          if (!cancelled) {
            updateStatus();
            toast({
              title: 'Monitoring setup failed',
              description: 'Could not start pickup point monitoring',
              variant: 'destructive',
            });
          }
        }
      } else if (!isActive && svcOn) {
        geofenceService.stopMonitoring();
        if (!cancelled) {
          updateStatus();
          toast({
            title: 'Pickup point monitoring stopped',
            description: 'Automatic pickup alerts are off for this trip.',
          });
        }
      } else if (!cancelled) {
        updateStatus();
      }

      lastTripActiveRef.current = isActive;
    };

    void sync();
    return () => {
      cancelled = true;
    };
  }, [isActive, driverId, toast]);

  // Update status periodically
  useEffect(() => {
    const interval = setInterval(updateStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (!isActive) return 'secondary';
    if (monitoringStatus.isMonitoring) return 'default';
    return 'destructive';
  };

  const getStatusIcon = () => {
    if (!isActive) return <Shield className="h-4 w-4" />;
    if (monitoringStatus.isMonitoring) return <CheckCircle className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (!isActive) return 'Trip Inactive';
    if (monitoringStatus.isMonitoring) return 'Monitoring Active';
    return 'Monitoring Inactive';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Pickup Point Monitoring
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">{getStatusText()}</span>
          </div>
          <Badge variant={getStatusColor()}>
            {monitoringStatus.isMonitoring ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Monitoring Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">{monitoringStatus.pickupPoints}</div>
            <div className="text-sm text-muted-foreground">Pickup Points</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">{monitoringStatus.activeZones}</div>
            <div className="text-sm text-muted-foreground">Active Zones</div>
          </div>
        </div>

        {/* Description */}
        <div className="text-sm text-muted-foreground">
          {isActive ? (
            monitoringStatus.isMonitoring ? (
              <>
                <CheckCircle className="inline h-4 w-4 mr-1 text-green-600" />
                Automatically sending notifications to guardians when you arrive at or depart from pickup points.
              </>
            ) : (
              <>
                <AlertTriangle className="inline h-4 w-4 mr-1 text-amber-600" />
                Monitoring setup in progress. Notifications will start once pickup points are loaded.
              </>
            )
          ) : (
            <>
              <Shield className="inline h-4 w-4 mr-1 text-muted-foreground" />
              Start a trip to enable automatic pickup point monitoring and guardian notifications.
            </>
          )}
        </div>

        {/* Manual Control (for debugging/testing) */}
        {isActive && (
          <div className="pt-2 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (monitoringStatus.isMonitoring) {
                    geofenceService.stopMonitoring();
                  } else {
                    const ok = await geofenceService.startMonitoring(driverId);
                    if (!ok) {
                      toast({
                        title: 'No pickup coordinates',
                        description:
                          'Students need pickup map coordinates in admin before monitoring can run.',
                        variant: 'destructive',
                      });
                    }
                  }
                  updateStatus();
                }}
              >
                {monitoringStatus.isMonitoring ? 'Stop' : 'Start'} Monitoring
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={updateStatus}
              >
                Refresh Status
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GeofenceMonitor;