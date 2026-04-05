import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { databaseIntegrationService } from '@/services/databaseIntegrationService';
import { invalidateLocalFcmMessaging } from '@/services/guardianPushService';

interface User {
  id: string;
  email: string;
  username: string;
  user_type: 'admin' | 'driver' | 'guardian';
  mobile_number?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string, role: string) => Promise<void>;
  loginWithMobileNumber: (mobileNumber: string, role: string) => Promise<void>;
  loginWithQR: (qrData: string) => Promise<void>;
  register: (email: string, password: string, role: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('sishu_tirtha_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('sishu_tirtha_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (identifier: string, password: string, role: string) => {
    try {
      setLoading(true);
      
      // Clean and normalize inputs
      const cleanEmail = identifier.trim().toLowerCase();
      const cleanRole = role.trim().toLowerCase();
      
      // Check for the specific role profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .eq('user_type', cleanRole)
        .maybeSingle();

      if (error) {
        console.error('Login query error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!profile) {
        // Check if user exists with different role
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', cleanEmail);
          
        if (allProfiles && allProfiles.length > 0) {
          const existingRole = allProfiles[0].user_type;
          throw new Error(`Account exists as ${existingRole}, not ${cleanRole}. Please select the correct role.`);
        } else {
          throw new Error(`No account found with email ${identifier}.`);
        }
      }

      const userData: User = {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        user_type: profile.user_type as 'admin' | 'driver' | 'guardian',
        mobile_number: profile.mobile_number
      };

      setUser(userData);
      localStorage.setItem('sishu_tirtha_user', JSON.stringify(userData));

      // Initialize FCM token for notifications
      try {
        await databaseIntegrationService.initializeFCMToken(userData.id);
      } catch (fcmError) {
        console.warn('FCM initialization failed:', fcmError);
        // Don't fail login for FCM issues
      }

      toast({
        title: "Login Successful",
        description: `Welcome back, ${profile.username}!`,
      });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithMobileNumber = async (mobileNumber: string, role: string) => {
    try {
      setLoading(true);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('mobile_number', mobileNumber)
        .eq('user_type', role)
        .maybeSingle();

      if (error) {
        console.error('Mobile login query error:', error);
        throw new Error('Database error occurred during login.');
      }

      if (!profile) {
        throw new Error(`No ${role} account found with mobile number ${mobileNumber}.`);
      }

      const userData: User = {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        user_type: profile.user_type as 'admin' | 'driver' | 'guardian',
        mobile_number: profile.mobile_number
      };

      setUser(userData);
      localStorage.setItem('sishu_tirtha_user', JSON.stringify(userData));

      // Initialize FCM token for notifications
      await databaseIntegrationService.initializeFCMToken(userData.id);

      toast({
        title: "Login Successful",
        description: `Welcome back, ${profile.username}!`,
      });
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithQR = async (qrData: string) => {
    // QR login implementation - placeholder for now
    throw new Error('QR login not implemented yet');
  };

  const register = async (email: string, password: string, role: string, name: string) => {
    // Registration implementation - placeholder for now
    throw new Error('Registration not implemented yet');
  };

  const logout = async () => {
    if (user) {
      // Clear user session in database
      try {
        await databaseIntegrationService.clearUserSession(user.id);
        if (user.user_type === 'guardian') {
          await invalidateLocalFcmMessaging();
        }
      } catch (error) {
        console.error('Error clearing user session:', error);
      }
    }
    
    // Clear all user state
    setUser(null);
    
    // Clear ALL possible localStorage keys
    localStorage.removeItem('sishu_tirtha_user');
    localStorage.removeItem('sishuTirthaUser'); // Legacy key
    localStorage.removeItem('sishu_tirtha_user_backup');
    
    // Clear all OTP completion flags
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('otp_completed_')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear session storage as well
    sessionStorage.clear();
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const resetPassword = async (email: string) => {
    // Reset password implementation - placeholder for now
    throw new Error('Password reset not implemented yet');
  };

  const value = {
    user,
    loading,
    login,
    loginWithMobileNumber,
    loginWithQR,
    register,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within a SupabaseAuthProvider");
  }
  return context;
};

export type { User };