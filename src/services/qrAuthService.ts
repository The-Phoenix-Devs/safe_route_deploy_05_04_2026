import { supabase } from '@/integrations/supabase/client';
import { signInUser, getUserProfile } from './authService';

export interface QRCodeData {
  token: string;
  username: string;
  password?: string;
  email?: string;
}

export interface QRAuthResult {
  id: string;
  email: string;
  name: string;
  role: 'driver';
  username: string;
  requiresPassword?: boolean;
}

// Verify QR token and authenticate driver
export const authenticateWithQRCode = async (qrCodeData: QRCodeData): Promise<QRAuthResult> => {
  try {
    // First verify the QR token exists in the database
    const { data: driver, error } = await supabase
      .from('drivers')
      .select(`
        *,
        profile:profiles(username, email, firebase_uid)
      `)
      .eq('qr_token', qrCodeData.token)
      .single();

    if (error || !driver) {
      throw new Error('Invalid QR code or driver not found');
    }

    // Verify the username matches
    if (driver.profile?.username !== qrCodeData.username) {
      throw new Error('QR code data mismatch');
    }

    // For QR code authentication, we need either:
    // 1. Password in QR code (for newly created drivers)
    // 2. Just verification that QR token is valid (driver needs to enter password separately)
    
    if (qrCodeData.password && driver.profile?.email) {
      // Full QR authentication with password
      try {
        const userCredential = await signInUser(driver.profile.email, qrCodeData.password);
        
        // Get full user profile
        const userProfile = await getUserProfile(userCredential.user.uid);
        
        if (!userProfile) {
          throw new Error('User profile not found');
        }

        return {
          id: driver.profile.firebase_uid,
          email: driver.profile.email,
          name: driver.name,
          role: 'driver' as const,
          username: driver.profile.username
        };
      } catch (authError) {
        throw new Error('Invalid credentials in QR code');
      }
    } else {
      // QR code verification only - driver will need to enter password manually
      return {
        id: driver.profile?.firebase_uid || '',
        email: driver.profile?.email || '',
        name: driver.name,
        role: 'driver' as const,
        username: driver.profile?.username || '',
        requiresPassword: true // Flag to indicate password is needed
      };
    }
  } catch (error) {
    console.error('QR authentication error:', error);
    throw error;
  }
};

// Generate QR code data for driver
export const generateDriverQRData = (driver: any, credentials: { username: string; password: string }): string => {
  const qrData: QRCodeData = {
    token: driver.qr_token,
    username: credentials.username,
    password: credentials.password,
    email: driver.profile?.email
  };
  
  return JSON.stringify(qrData);
};