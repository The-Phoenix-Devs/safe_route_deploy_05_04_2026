import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gauge, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SpeedMonitorProps {
  driverId: string;
  isActive: boolean;
}

interface SpeedViolation {
  id: string;
  speed_recorded: number;
  speed_limit: number;
  severity: string;
  violation_time: string;
  acknowledged: boolean;
}

const SpeedMonitor: React.FC<SpeedMonitorProps> = ({ driverId, isActive }) => {
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [speedLimit, setSpeedLimit] = useState<number>(50); // Default speed limit
  const [violations, setViolations] = useState<SpeedViolation[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const { toast } = useToast();

  // Monitor speed when tracking is active
  useEffect(() => {
    if (!isActive || !driverId) {
      setIsMonitoring(false);
      return;
    }

    setIsMonitoring(true);
    
    const watchId = navigator.geolocation?.watchPosition(
      (position) => {
        const speed = position.coords.speed ? Math.abs(position.coords.speed * 3.6) : 0; // Convert m/s to km/h
        setCurrentSpeed(speed);
        
        // Check for speed violations
        if (speed > speedLimit + 5) { // 5 km/h tolerance
          checkSpeedViolation(speed, position);
        }
      },
      (error) => {
        console.error('Speed monitoring error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 1000
      }
    );

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      setIsMonitoring(false);
    };
  }, [isActive, driverId, speedLimit]);

  const checkSpeedViolation = async (speed: number, position: GeolocationPosition) => {
    const excessSpeed = speed - speedLimit;
    let severity = 'warning';
    
    if (excessSpeed > 20) {
      severity = 'major';
    } else if (excessSpeed > 10) {
      severity = 'minor';
    }

    try {
      const { error } = await supabase
        .from('speed_violations')
        .insert({
          driver_id: driverId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed_recorded: speed,
          speed_limit: speedLimit,
          severity
        });

      if (error) throw error;

      // Show toast notification
      toast({
        title: `Speed Limit Exceeded!`,
        description: `Current: ${speed.toFixed(0)} km/h | Limit: ${speedLimit} km/h`,
        variant: severity === 'major' ? 'destructive' : 'default',
      });

      // Reload violations
      loadViolations();
      
    } catch (error: any) {
      console.error('Failed to record speed violation:', error);
    }
  };

  const loadViolations = async () => {
    if (!driverId) return;
    
    try {
      const { data, error } = await supabase
        .from('speed_violations')
        .select('*')
        .eq('driver_id', driverId)
        .eq('acknowledged', false)
        .order('violation_time', { ascending: false })
        .limit(5);

      if (error) throw error;
      setViolations(data || []);
    } catch (error: any) {
      console.error('Failed to load violations:', error);
    }
  };

  const acknowledgeViolation = async (violationId: string) => {
    try {
      const { error } = await supabase
        .from('speed_violations')
        .update({ acknowledged: true })
        .eq('id', violationId);

      if (error) throw error;
      
      toast({
        title: "Violation acknowledged",
        description: "Speed violation has been acknowledged.",
      });

      loadViolations();
    } catch (error: any) {
      console.error('Failed to acknowledge violation:', error);
    }
  };

  useEffect(() => {
    if (driverId) {
      loadViolations();
    }
  }, [driverId]);

  const getSpeedColor = () => {
    if (currentSpeed <= speedLimit) return 'text-green-600';
    if (currentSpeed <= speedLimit + 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'minor': return 'bg-orange-100 text-orange-800';
      case 'major': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          Speed Monitoring
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Current Speed</p>
            <p className={`text-3xl font-bold ${getSpeedColor()}`}>
              {currentSpeed.toFixed(0)} km/h
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Speed Limit</p>
            <p className="text-xl font-semibold text-muted-foreground">
              {speedLimit} km/h
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isMonitoring ? "default" : "secondary"}>
            {isMonitoring ? "Monitoring Active" : "Monitoring Inactive"}
          </Badge>
          {currentSpeed > speedLimit && (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Speed Limit Exceeded
            </Badge>
          )}
        </div>

        {/* Speed Limit Controls */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Adjust Speed Limit</p>
          <div className="flex gap-2">
            {[30, 40, 50, 60, 80].map((limit) => (
              <Button
                key={limit}
                variant={speedLimit === limit ? "default" : "outline"}
                size="sm"
                onClick={() => setSpeedLimit(limit)}
              >
                {limit}
              </Button>
            ))}
          </div>
        </div>

        {/* Recent Violations */}
        {violations.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Recent Violations</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {violations.map((violation) => (
                <div key={violation.id} className="border rounded p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge className={getSeverityColor(violation.severity)}>
                        {violation.severity.toUpperCase()}
                      </Badge>
                      <span className="ml-2">
                        {violation.speed_recorded.toFixed(0)} km/h in {violation.speed_limit} km/h zone
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => acknowledgeViolation(violation.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(violation.violation_time).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isActive && (
          <div className="text-xs text-muted-foreground bg-yellow-50 p-2 rounded">
            ⚠️ Start a trip to enable speed monitoring
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>• Speed monitoring is active during trips</p>
          <p>• Violations are recorded when exceeding speed limit by 5+ km/h</p>
          <p>• Major violations (20+ km/h over) are flagged for review</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpeedMonitor;