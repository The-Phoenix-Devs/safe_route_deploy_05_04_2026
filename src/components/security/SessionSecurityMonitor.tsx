import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SecurityService } from '@/utils/securityService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const SessionSecurityMonitor: React.FC = () => {
  const { user, logout } = useAuth();
  const [securityStatus, setSecurityStatus] = useState<'secure' | 'warning' | 'critical'>('secure');
  const [showAlert, setShowAlert] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    let interval: NodeJS.Timeout;

    const checkSecurity = async () => {
      try {
        const isSecure = await SecurityService.checkSessionSecurity(user.id);
        
        if (!isSecure) {
          setSecurityStatus('critical');
          setShowAlert(true);
          toast({
            title: "Security Alert",
            description: "Suspicious activity detected on your account",
            variant: "destructive",
          });
        } else {
          setSecurityStatus('secure');
          setShowAlert(false);
        }
      } catch (error) {
        console.error('Error checking session security:', error);
      }
    };

    // Check immediately
    checkSecurity();

    // Check every 5 minutes
    interval = setInterval(checkSecurity, 5 * 60 * 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, toast]);

  const handleSecureLogout = async () => {
    try {
      await logout();
      toast({
        title: "Secure Logout",
        description: "You have been safely logged out",
      });
    } catch (error) {
      console.error('Error during secure logout:', error);
    }
  };

  if (!showAlert || securityStatus === 'secure') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      <Alert variant="destructive" className="border-red-500 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="space-y-3">
          <div>
            <strong>Security Alert</strong>
            <p className="text-sm mt-1">
              Suspicious activity detected on your account. For your security, 
              please log out and log back in.
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="destructive"
              onClick={handleSecureLogout}
            >
              Secure Logout
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowAlert(false)}
            >
              Dismiss
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default SessionSecurityMonitor;