
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { createDriver, getDrivers, deleteDriver, registerUser } from '@/services/firebase';
import { Driver, DriverFormData } from '@/components/admin/drivers/types';
import { generateCredentials } from '@/utils/authUtils';

export const useDrivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load drivers from Firebase on hook initialization
  useEffect(() => {
    const loadDrivers = async () => {
      try {
        setLoading(true);
        const driversData = await getDrivers();
        setDrivers(driversData as Driver[]);
      } catch (error: any) {
        console.error('Error loading drivers:', error);
        toast({
          variant: "destructive",
          title: "Error loading drivers",
          description: error.message || "Failed to load driver data"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadDrivers();
  }, [toast]);

  // Add new driver with auto-generated credentials and QR code token
  const addDriver = async (driverData: DriverFormData) => {
    try {
      // Generate credentials and QR token
      const credentials = generateCredentials(driverData.name, 'driver');
      const qrToken = `driver_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create driver in Firebase
      const newDriverData = {
        ...driverData,
        username: credentials.username,
        password: credentials.password,
        qrToken
      };
      
      const driverId = await createDriver(newDriverData);

      // Try to register the driver in Firebase Auth
      try {
        const email = `${credentials.username}@example.com`; // Generate an email for Auth
        await registerUser(
          email, 
          credentials.password, 
          driverData.name, 
          'driver',
          credentials.username
        );
      } catch (authError) {
        console.error("Could not create driver auth account:", authError);
        // Continue even if auth creation fails - this is a fallback
      }
      
      // Add to state for UI update
      const newDriverWithId: Driver = {
        ...newDriverData,
        id: driverId
      };
      
      setDrivers([...drivers, newDriverWithId]);
      
      toast({
        title: 'Success',
        description: 'New driver added successfully with auto-generated login credentials',
      });
      
      return {
        driver: newDriverWithId,
        credentials: {
          username: credentials.username,
          password: credentials.password
        },
        qrToken
      };
    } catch (error: any) {
      console.error("Error adding driver:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add new driver"
      });
      throw error;
    }
  };

  const removeDriver = async (id: string) => {
    try {
      // Delete from Firebase
      await deleteDriver(id);
      
      // Remove from state
      setDrivers(drivers.filter(driver => driver.id !== id));
      
      toast({
        title: 'Success',
        description: 'Driver deleted successfully',
      });
    } catch (error: any) {
      console.error("Error deleting driver:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete driver"
      });
      throw error;
    }
  };

  return {
    drivers,
    loading,
    addDriver,
    removeDriver,
  };
};
