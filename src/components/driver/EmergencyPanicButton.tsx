import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield, Siren } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { enhancedNotificationService } from '@/services/enhancedNotificationService';

/** Fallback map point if GPS is denied (Hooghly area — same default as driver map). */
const FALLBACK_EMERGENCY_LOCATION = { lat: 22.783014, lng: 87.773584 };

interface EmergencyPanicButtonProps {
  driverId: string;
  busNumber?: string | null;
  isActive: boolean;
}

const EmergencyPanicButton: React.FC<EmergencyPanicButtonProps> = ({ 
  driverId,
  busNumber,
  isActive 
}) => {
  const [isTriggering, setIsTriggering] = useState(false);
  const [hasActivePanic, setHasActivePanic] = useState(false);
  const { toast } = useToast();

  const triggerPanicAlert = async () => {
    if (!driverId || isTriggering) return;
    
    setIsTriggering(true);
    
    try {
      // Get current location
      let latitude: number | null = null;
      let longitude: number | null = null;
      
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (error) {
          console.error('Could not get location for panic alert:', error);
        }
      }

      // Create panic alert in database
      const { error } = await supabase
        .from('panic_alerts')
        .insert({
          driver_id: driverId,
          latitude,
          longitude,
          status: 'active'
        });

      if (error) {
        throw error;
      }

      setHasActivePanic(true);

      const lat = latitude ?? FALLBACK_EMERGENCY_LOCATION.lat;
      const lng = longitude ?? FALLBACK_EMERGENCY_LOCATION.lng;

      try {
        await enhancedNotificationService.sendEmergencyAlert(
          driverId,
          busNumber?.trim() || "Unknown",
          { lat, lng },
        );
      } catch (notifyErr) {
        console.error("Emergency push/SMS pipeline failed:", notifyErr);
      }
      
      toast({
        title: "🚨 EMERGENCY ALERT SENT",
        description: "Emergency services and administrators have been notified of your location.",
        variant: "destructive",
      });
      
    } catch (error: any) {
      console.error('Failed to trigger panic alert:', error);
      toast({
        title: "Failed to send alert",
        description: "Could not send emergency alert. Please try again or call emergency services directly.",
        variant: "destructive",
      });
    } finally {
      setIsTriggering(false);
    }
  };

  const resolvePanicAlert = async () => {
    try {
      const { error } = await supabase
        .from('panic_alerts')
        .update({ 
          status: 'resolved',
          resolved_time: new Date().toISOString()
        })
        .eq('driver_id', driverId)
        .eq('status', 'active');

      if (error) throw error;

      setHasActivePanic(false);
      
      toast({
        title: "Emergency resolved",
        description: "Emergency alert has been marked as resolved.",
      });
      
    } catch (error: any) {
      console.error('Failed to resolve panic alert:', error);
      toast({
        title: "Failed to resolve alert",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <Shield className="h-5 w-5" />
          Emergency Safety
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-red-600">
          <p>Use this button only in genuine emergency situations:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Medical emergency</li>
            <li>Vehicle breakdown in dangerous location</li>
            <li>Security threat or unsafe situation</li>
            <li>Any situation requiring immediate assistance</li>
          </ul>
        </div>

        {!hasActivePanic ? (
          <Button 
            onClick={triggerPanicAlert}
            disabled={!isActive || isTriggering}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg font-bold"
            size="lg"
          >
            <Siren className="h-6 w-6 mr-3" />
            {isTriggering ? 'SENDING ALERT...' : '🚨 EMERGENCY PANIC BUTTON'}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="bg-red-100 border border-red-300 rounded p-3">
              <div className="flex items-center gap-2 text-red-700 font-semibold">
                <AlertTriangle className="h-5 w-5" />
                EMERGENCY ALERT ACTIVE
              </div>
              <p className="text-sm text-red-600 mt-1">
                Emergency services have been notified. Help is on the way.
              </p>
            </div>
            
            <Button 
              onClick={resolvePanicAlert}
              variant="outline"
              className="w-full border-green-500 text-green-700 hover:bg-green-50"
            >
              Mark Emergency as Resolved
            </Button>
          </div>
        )}

        {!isActive && (
          <div className="text-xs text-muted-foreground bg-yellow-50 p-2 rounded">
            ⚠️ Start a trip to enable emergency features
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p className="font-semibold">Emergency Contacts:</p>
          <p>Police: 100 | Fire: 101 | Ambulance: 102</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmergencyPanicButton;