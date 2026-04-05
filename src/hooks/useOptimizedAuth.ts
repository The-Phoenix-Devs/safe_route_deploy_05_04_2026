import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  username: string;
  user_type: 'admin' | 'driver' | 'guardian';
  mobile_number?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Optimized auth hook with better performance and caching
export const useOptimizedAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });
  const { toast } = useToast();

  // Memoized login functions to prevent unnecessary re-renders
  const loginWithEmail = useCallback(async (email: string, password: string, role: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .eq('user_type', role)
        .maybeSingle(); // Use maybeSingle to avoid errors when no data found

      if (error) throw error;
      if (!profile) throw new Error(`Invalid credentials or no ${role} account found.`);

      const userData: User = {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        user_type: profile.user_type as 'admin' | 'driver' | 'guardian',
        mobile_number: profile.mobile_number
      };

      setAuthState({ user: userData, loading: false, error: null });
      
      // Use session storage for better performance (cleared on tab close)
      sessionStorage.setItem('sishu_tirtha_user', JSON.stringify(userData));
      localStorage.setItem('sishu_tirtha_user_backup', JSON.stringify(userData));

      toast({
        title: "Login Successful",
        description: `Welcome back, ${profile.username}!`,
      });

      return userData;
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const loginWithMobile = useCallback(async (mobileNumber: string, role: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('mobile_number', mobileNumber)
        .eq('user_type', role)
        .maybeSingle();

      if (error) throw error;
      if (!profile) throw new Error(`No ${role} account found with mobile number ${mobileNumber}.`);

      const userData: User = {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        user_type: profile.user_type as 'admin' | 'driver' | 'guardian',
        mobile_number: profile.mobile_number
      };

      setAuthState({ user: userData, loading: false, error: null });
      
      sessionStorage.setItem('sishu_tirtha_user', JSON.stringify(userData));
      localStorage.setItem('sishu_tirtha_user_backup', JSON.stringify(userData));

      toast({
        title: "Login Successful",
        description: `Welcome back, ${profile.username}!`,
      });

      return userData;
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const logout = useCallback(() => {
    setAuthState({ user: null, loading: false, error: null });
    sessionStorage.removeItem('sishu_tirtha_user');
    localStorage.removeItem('sishu_tirtha_user_backup');
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  }, [toast]);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = () => {
      try {
        // Try session storage first (faster), then localStorage
        const storedUser = sessionStorage.getItem('sishu_tirtha_user') || 
                         localStorage.getItem('sishu_tirtha_user_backup');
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setAuthState({ user: userData, loading: false, error: null });
        } else {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        sessionStorage.removeItem('sishu_tirtha_user');
        localStorage.removeItem('sishu_tirtha_user_backup');
        setAuthState({ user: null, loading: false, error: 'Session expired' });
      }
    };

    initAuth();
  }, []);

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    loginWithEmail,
    loginWithMobile,
    logout
  };
};