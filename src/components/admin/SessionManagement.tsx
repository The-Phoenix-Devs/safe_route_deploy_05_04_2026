import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Users, LogOut } from 'lucide-react';

const SessionManagement: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCloseAllSessions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('close_all_active_sessions');
      
      if (error) {
        throw error;
      }

      const result = data?.[0];
      if (result) {
        toast({
          title: "Sessions Closed Successfully",
          description: `Cleared ${result.locations_cleared} active locations and ${result.sessions_closed} user tokens.`,
        });
      } else {
        toast({
          title: "Sessions Closed",
          description: "All active user sessions have been terminated.",
        });
      }
    } catch (error: any) {
      console.error('Error closing sessions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to close sessions. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Session Management</h2>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Force Close All Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Security Action</h4>
                <p className="text-sm text-amber-700">
                  This action will forcefully log out all users from the system by:
                </p>
                <ul className="text-sm text-amber-700 mt-2 space-y-1">
                  <li>• Deactivating all live location tracking</li>
                  <li>• Clearing all FCM tokens to stop push notifications</li>
                  <li>• Forcing users to log in again on their next access</li>
                </ul>
              </div>
            </div>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="w-full"
                disabled={isLoading}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isLoading ? "Closing Sessions..." : "Close All User Sessions"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will immediately log out ALL users from the system. They will need to log in again to continue using the application. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleCloseAllSessions}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, Close All Sessions
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionManagement;