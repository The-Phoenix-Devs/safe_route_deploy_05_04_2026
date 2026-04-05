
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useSimpleAuth } from '@/hooks/useSimpleAuth';

const AdminProfile: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useSimpleAuth();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "All fields are required",
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "New passwords don't match",
      });
      return;
    }

    setIsLoading(true);

    try {
      // For demo purposes, we're just verifying the current password is 'admin123'
      if (currentPassword !== 'admin123') {
        throw new Error("Current password is incorrect");
      }
      
      // In a real app, this would update the password in your database
      // For now, just show success message
      await new Promise(resolve => setTimeout(resolve, 800)); // Fake delay
      
      toast({
        title: "Success",
        description: "Password updated successfully",
      });
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      console.error("Password update error:", error);
      
      let errorMessage = "Could not update password. Please try again.";
      if (error.message === "Current password is incorrect") {
        errorMessage = "Current password is incorrect. Please try again.";
      }
      
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Admin Profile</h2>
      
      <div className="mb-6 p-4 bg-white rounded-md shadow-sm">
        <h3 className="text-lg font-medium mb-2">User Information</h3>
        <p><strong>Name:</strong> {user?.username || 'Admin User'}</p>
        <p><strong>Email:</strong> {user?.email || 'No email set'}</p>
        <p><strong>Role:</strong> {user?.user_type || 'admin'}</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirm New Password</Label>
              <Input
                id="confirm-new-password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </div>
            
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProfile;
