import { useState, useEffect } from 'react';
import { Driver, getDrivers, createDriver, deleteDriver, CreateDriverParams } from '@/services/driverService';
import { randomUuid } from '@/utils/randomUuid';
import { isAdminPanelUser } from '@/utils/adminAccess';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useSupabaseDrivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadDrivers = async () => {
    try {
      console.log('Loading drivers...');
      setLoading(true);
      const driversData = await getDrivers();
      console.log('Drivers loaded:', driversData);
      setDrivers(driversData);
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast({
        title: "Error",
        description: "Failed to load drivers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const addDriver = async (driverData: CreateDriverParams) => {
    try {
      console.log('Adding driver:', driverData);
      const newDriver = await createDriver(driverData);
      console.log('Driver added successfully:', newDriver);
      
      // Add to local state immediately
      setDrivers(prev => [newDriver, ...prev]);
      
      const issuedPin =
        typeof newDriver.initial_portal_pin === "string" && /^\d{6}$/.test(newDriver.initial_portal_pin)
          ? newDriver.initial_portal_pin
          : undefined;

      toast({
        title: "Success",
        description: issuedPin
          ? "Driver added. Use the QR dialog to show the code and send WhatsApp (includes mobile, PIN, and bus)."
          : "Driver added. Use the QR dialog to share login details.",
      });

      return {
        qrToken: newDriver.qr_token,
        mobileNumber: driverData.mobile_number,
        newDriver,
      };
    } catch (error) {
      console.error('Error adding driver:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create driver';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const removeDriver = async (id: string) => {
    try {
      // Get current user from localStorage to verify admin access
      const storedUser = localStorage.getItem('sishu_tirtha_user');
      if (!storedUser) {
        throw new Error('User not authenticated');
      }
      
      const userData = JSON.parse(storedUser);
      if (!isAdminPanelUser(userData.user_type)) {
        throw new Error('Access denied. Admin privileges required.');
      }

      console.log('Deleting driver:', id);
      await deleteDriver(id);
      setDrivers(prev => prev.filter(driver => driver.id !== id));
      
      toast({
        title: "Success",
        description: "Driver deleted successfully",
      });
    } catch (error) {
      console.error('Error removing driver:', error);
      toast({
        title: "Error",
        description: "Failed to delete driver",
        variant: "destructive",
      });
    }
  };

  const updateDriver = async (id: string, driverData: Partial<CreateDriverParams>) => {
    try {
      console.log('Updating driver:', id, driverData);
      const { data, error } = await supabase
        .from('drivers')
        .update(driverData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setDrivers(prev => prev.map(driver => 
        driver.id === id ? { ...driver, ...data } : driver
      ));
      
      toast({
        title: "Success",
        description: "Driver updated successfully",
      });

      return data;
    } catch (error) {
      console.error('Error updating driver:', error);
      toast({
        title: "Error",
        description: "Failed to update driver",
        variant: "destructive",
      });
      throw error;
    }
  };

  /** Issue a new qr_token; invalidates any previously printed QR codes for this driver. */
  const regenerateDriverQrToken = async (id: string) => {
    try {
      const newToken = randomUuid();
      const { data, error } = await supabase
        .from("drivers")
        .update({
          qr_token: newToken,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      setDrivers((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...data } : d)),
      );

      toast({
        title: "QR code renewed",
        description: "Older printouts or screenshots will no longer work.",
      });
      return data;
    } catch (error) {
      console.error("Error regenerating QR:", error);
      toast({
        title: "Error",
        description: "Could not renew QR token",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    drivers,
    loading,
    addDriver,
    updateDriver,
    removeDriver,
    refreshDrivers: loadDrivers,
    regenerateDriverQrToken,
  };
};
