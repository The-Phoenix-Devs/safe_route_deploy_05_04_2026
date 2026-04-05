import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthUser {
  id: string;
  email: string;
  user_type: string;
  mobile_number?: string;
  username: string;
}

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check current session
    const getSession = async () => {
      try {
        const { data, error } = await supabase.rpc('get_current_user_profile');
        if (error) throw error;
        
        if (data && data.length > 0) {
          const profile = data[0];
          // Get full profile data
          const { data: fullProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profile.user_id)
            .single();
            
          if (fullProfile) {
            setUser({
              id: fullProfile.id,
              email: fullProfile.email,
              user_type: fullProfile.user_type,
              mobile_number: fullProfile.mobile_number,
              username: fullProfile.username
            });
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();
  }, []);

  const loginWithMobile = async (mobileNumber: string, role: string) => {
    try {
      setLoading(true);
      
      // Check if profile exists with this mobile number
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('mobile_number', mobileNumber)
        .eq('user_type', role)
        .single();

      if (error || !profile) {
        throw new Error(`No ${role} account found with this mobile number. Please contact your administrator.`);
      }

      // Set user data
      setUser({
        id: profile.id,
        email: profile.email,
        user_type: profile.user_type,
        mobile_number: profile.mobile_number,
        username: profile.username
      });

      toast({
        title: "Login Successful",
        description: `Welcome back, ${profile.username}!`,
      });

      return profile;
    } catch (error: any) {
      console.error('Mobile login error:', error);
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

  const loginWithEmail = async (email: string, password: string, role: string) => {
    try {
      setLoading(true);
      
      // For admin login - simulate Firebase auth but use Supabase data
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .eq('user_type', role)
        .single();

      if (error || !profile) {
        throw new Error(`No ${role} account found with this email.`);
      }

      // Set user data
      setUser({
        id: profile.id,
        email: profile.email,
        user_type: profile.user_type,
        mobile_number: profile.mobile_number,
        username: profile.username
      });

      toast({
        title: "Login Successful",
        description: `Welcome back, ${profile.username}!`,
      });

      return profile;
    } catch (error: any) {
      console.error('Email login error:', error);
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

  const logout = async () => {
    setUser(null);
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  return {
    user,
    loading,
    loginWithMobile,
    loginWithEmail,
    logout
  };
};