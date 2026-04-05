import { useState, useCallback } from 'react';
import { biometricService } from '@/services/biometricService';
import { toast } from 'sonner';

export const useBiometricSetup = () => {
  const [isSetupInProgress, setIsSetupInProgress] = useState(false);

  const setupBiometricLogin = useCallback(async (username: string, password: string) => {
    try {
      setIsSetupInProgress(true);

      // Check if biometric authentication is available
      const availability = await biometricService.isAvailable();
      if (!availability.isAvailable) {
        toast.error('Biometric authentication is not available on this device');
        return false;
      }

      // Register WebAuthn credential
      const registrationResult = await biometricService.registerBiometric(username);
      
      if (registrationResult.success) {
        // Also store traditional credentials as fallback
        await biometricService.storeCredentials(username, password);
        
        toast.success('Biometric login has been set up successfully!');
        return true;
      } else {
        toast.error(registrationResult.error || 'Failed to set up biometric login');
        return false;
      }
    } catch (error) {
      console.error('Biometric setup error:', error);
      toast.error('Failed to set up biometric login');
      return false;
    } finally {
      setIsSetupInProgress(false);
    }
  }, []);

  const isBiometricSetup = useCallback(async () => {
    try {
      const availability = await biometricService.isAvailable();
      if (!availability.isAvailable) {
        return false;
      }

      const hasWebAuthn = !!localStorage.getItem('webauthn_credential_id');
      const hasStoredCredentials = !!(await biometricService.getStoredCredentials());
      
      return hasWebAuthn || hasStoredCredentials;
    } catch (error) {
      console.error('Error checking biometric setup:', error);
      return false;
    }
  }, []);

  const clearBiometricSetup = useCallback(async () => {
    try {
      await biometricService.clearStoredCredentials();
      localStorage.removeItem('webauthn_credential_id');
      localStorage.removeItem('webauthn_username');
      localStorage.removeItem('biometric_temp_token');
      toast.success('Biometric login has been disabled');
    } catch (error) {
      console.error('Error clearing biometric setup:', error);
      toast.error('Failed to disable biometric login');
    }
  }, []);

  return {
    setupBiometricLogin,
    isBiometricSetup,
    clearBiometricSetup,
    isSetupInProgress
  };
};