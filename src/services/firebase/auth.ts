import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db } from './config';
import { User } from '@/contexts/AuthContext';

// Helper function to handle Firebase errors
const handleFirebaseError = (error: any, operation: string) => {
  console.error(`Firebase ${operation} error:`, error);
  
  // Check if it's a permission error
  if (error.code === 'permission-denied') {
    throw new Error(`${operation} failed: Missing or insufficient permissions.`);
  } else if (error.code === 'auth/user-not-found') {
    throw new Error('Invalid credentials.');
  } else if (error.code === 'auth/wrong-password') {
    throw new Error('Invalid credentials.');
  } else if (error.code === 'auth/email-already-in-use') {
    throw new Error('Email already in use.');
  } else if (error.code === 'auth/too-many-requests') {
    throw new Error('Too many failed attempts. Please wait 15-30 minutes before trying again. You can also try using a different browser or device.');
  } else if (error.code === 'auth/invalid-phone-number') {
    throw new Error('Invalid phone number format.');
  } else if (error.code === 'auth/captcha-check-failed') {
    throw new Error('reCAPTCHA verification failed. Please try again.');
  } else if (error.code === 'auth/phone-number-already-exists') {
    throw new Error('Phone number is already registered.');
  } else if (error.code === 'auth/invalid-verification-code') {
    throw new Error('Invalid OTP. Please check and try again.');
  } else if (error.code === 'auth/code-expired') {
    throw new Error('OTP has expired. Please request a new one.');
  }
  
  throw error;
};

// Auth functions
export const loginWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    // For admin login, we'll use Supabase to verify credentials
    if (email.toLowerCase() === 'subhankar.ghorui1995@gmail.com') {
      // Check if admin profile exists in Supabase
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data: adminProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('user_type', 'admin')
        .maybeSingle();
      
      if (error) {
        console.error('Supabase query error:', error);
        throw new Error('Database connection error');
      }
      
      if (!adminProfile) {
        throw new Error('Invalid credentials or no admin account found.');
      }
      
      // For admin, we'll use a simple password check (this should be improved with proper hashing)
      if (password === 'Suvo@1250') {
        // Store session info
        sessionStorage.setItem('sishu_tirtha_user', JSON.stringify({
          id: adminProfile.id,
          firebase_uid: adminProfile.firebase_uid,
          email: adminProfile.email,
          name: 'Subhankar Ghorui',
          role: 'admin'
        }));
        
        return {
          id: adminProfile.id,
          email: adminProfile.email,
          name: 'Subhankar Ghorui',
          role: 'admin'
        };
      } else {
        throw new Error('Invalid credentials or no admin account found.');
      }
    }
    
    // For non-admin users, continue with Firebase auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Get additional user data from Firestore
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const userData = userDoc.data();
      
      if (!userData || !userData.role) {
        throw new Error('User data not found');
      }
      
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: userData.name || '',
        role: userData.role
      };
    } catch (firestoreError) {
      console.error('Firestore read error:', firestoreError);
      throw new Error('Failed to fetch user data. Missing or insufficient permissions.');
    }
  } catch (error: any) {
    if (error.message) {
      throw error; // Re-throw custom errors as-is
    }
    handleFirebaseError(error, 'login');
    throw error;
  }
};

// Real Firebase OTP implementation
export const sendOTPToMobile = async (phoneNumber: string): Promise<ConfirmationResult> => {
  try {
    // Add country code if not present
    const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;
    
    // Clean up any existing reCAPTCHA verifier first
    if ((window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier.clear();
      } catch (clearError) {
        console.warn('Error clearing previous reCAPTCHA:', clearError);
      }
      (window as any).recaptchaVerifier = null;
    }
    
    // Wait a bit to ensure DOM is ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if the recaptcha container exists
    const recaptchaContainer = document.getElementById('recaptcha-container');
    if (!recaptchaContainer) {
      throw new Error('reCAPTCHA container not found. Please refresh the page and try again.');
    }
    
    // Initialize new reCAPTCHA verifier
    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: (response: any) => {
        console.log('reCAPTCHA solved');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
        // Clean up expired verifier
        if ((window as any).recaptchaVerifier) {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
        }
      },
      'error-callback': (error: any) => {
        console.error('reCAPTCHA error:', error);
        // Clean up on error
        if ((window as any).recaptchaVerifier) {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
        }
      }
    });
    
    // Pre-render reCAPTCHA for faster verification
    try {
      await (window as any).recaptchaVerifier.render();
      console.log('reCAPTCHA rendered successfully');
    } catch (renderError) {
      console.error('reCAPTCHA render error:', renderError);
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
      throw new Error('reCAPTCHA initialization failed. Please refresh and try again.');
    }
    
    // Send OTP via Firebase
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, (window as any).recaptchaVerifier);
    
    console.log('OTP sent to:', formattedPhone);
    return confirmationResult;
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    
    // Reset reCAPTCHA on error
    if ((window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier.clear();
      } catch (clearError) {
        console.warn('Error clearing reCAPTCHA on error:', clearError);
      }
      (window as any).recaptchaVerifier = null;
    }
    
    // Provide more specific error messages
    if (error.message?.includes('reCAPTCHA')) {
      throw new Error('reCAPTCHA verification failed. Please refresh and try again.');
    } else if (error.message?.includes('quota')) {
      throw new Error('SMS quota exceeded. Please try again later.');
    } else if (error.message?.includes('invalid-phone-number')) {
      throw new Error('Invalid phone number format. Please check and try again.');
    }
    
    throw new Error(error.message || 'Failed to send OTP. Please try again.');
  }
};

export const verifyOTPAndLogin = async (confirmationResult: ConfirmationResult, otp: string, role: string): Promise<User> => {
  try {
    // Handle test case for rate limiting
    if (otp === '123456' && typeof confirmationResult.confirm === 'function') {
      // Extract mobile number from the dummy result or use a test number
      const testResult = await confirmationResult.confirm(otp);
      const mobileNumber = testResult.user?.phoneNumber?.replace('+91', '') || '';
      
      // Continue with Supabase lookup using the mobile number
      const { supabase } = await import('@/integrations/supabase/client');
      
      let userData;
      if (role === 'driver') {
        // Look up driver by mobile number and get profile info
        const { data: driverData, error } = await supabase
          .from('drivers')
          .select(`
            *,
            profile:profiles(id, email, username)
          `)
          .eq('mobile_number', mobileNumber)
          .single();
        
        if (error || !driverData) {
          throw new Error('Driver not found with this mobile number');
        }
        
        userData = {
          id: driverData.profile_id,
          email: driverData.profile?.email || `${mobileNumber}@driver.app`,
          name: driverData.name,
          role: 'driver' as const,
          mobileNumber: driverData.mobile_number
        };
      } else if (role === 'guardian') {
        // Look up guardian profile by mobile number through students table
        const { data: studentData, error } = await supabase
          .from('students')
          .select(`
            *,
            guardian_profile:profiles!guardian_profile_id(id, email, username)
          `)
          .eq('guardian_mobile', mobileNumber)
          .single();
        
        if (error || !studentData) {
          throw new Error('Guardian not found with this mobile number');
        }
        
        const profileId = studentData.guardian_profile_id || studentData.id;
        
        userData = {
          id: profileId,
          email: studentData.guardian_profile?.email || `${mobileNumber}@guardian.app`,
          name: studentData.guardian_name,
          role: 'guardian' as const,
          mobileNumber: studentData.guardian_mobile
        };
      } else {
        throw new Error('Invalid role for mobile login');
      }
      
      return userData;
    }
    
    // Normal Firebase OTP verification
    const result = await confirmationResult.confirm(otp);
    const firebaseUser = result.user;
    
    // Extract mobile number from Firebase user
    const mobileNumber = firebaseUser.phoneNumber?.replace('+91', '') || '';
    
    // Query Supabase to find user by mobile number and role
    const { supabase } = await import('@/integrations/supabase/client');
    
    let userData;
    if (role === 'driver') {
      // Look up driver by mobile number and get profile info
      const { data: driverData, error } = await supabase
        .from('drivers')
        .select(`
          *,
          profile:profiles(id, email, username)
        `)
        .eq('mobile_number', mobileNumber)
        .single();
      
      if (error || !driverData) {
        throw new Error('Driver not found with this mobile number');
      }
      
      userData = {
        id: driverData.profile_id, // Use profile_id instead of driver id
        email: driverData.profile?.email || `${mobileNumber}@driver.app`,
        name: driverData.name,
        role: 'driver' as const,
        mobileNumber: driverData.mobile_number
      };
    } else if (role === 'guardian') {
      // Look up guardian profile by mobile number through students table
      const { data: studentData, error } = await supabase
        .from('students')
        .select(`
          *,
          guardian_profile:profiles!guardian_profile_id(id, email, username)
        `)
        .eq('guardian_mobile', mobileNumber)
        .single();
      
      if (error || !studentData) {
        throw new Error('Guardian not found with this mobile number');
      }
      
      // Use guardian_profile_id if available, otherwise use student id as fallback
      const profileId = studentData.guardian_profile_id || studentData.id;
      
      userData = {
        id: profileId,
        email: studentData.guardian_profile?.email || `${mobileNumber}@guardian.app`,
        name: studentData.guardian_name,
        role: 'guardian' as const,
        mobileNumber: studentData.guardian_mobile
      };
    } else {
      throw new Error('Invalid role for mobile login');
    }
    
    // Send welcome SMS after successful login
    try {
      await supabase.functions.invoke('send-welcome-sms', {
        body: {
          mobileNumber: mobileNumber,
          userName: userData.name,
          userType: userData.role
        }
      });
      console.log('Welcome SMS sent successfully');
    } catch (smsError) {
      console.error('Welcome SMS failed:', smsError);
      // Don't fail login if SMS fails
    }
    
    return userData;
  } catch (error: any) {
    console.error('OTP verification error:', error);
    throw new Error(error.message || 'OTP verification failed');
  }
};

export const loginWithUsername = async (username: string, password: string, role: string): Promise<User> => {
  try {
    // Special case for admin login with known admin email
    if (role === 'admin' && username.toLowerCase() === 'subhankar.ghorui1995@gmail.com') {
      return loginWithEmail(username, password);
    }
    
    // Query Firestore to find user by username
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username), where('role', '==', role));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('User not found');
      }
      
      // Get the email from the found user document
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const email = userData.email;
      
      if (!email) {
        throw new Error('User email not found');
      }
      
      // Log in with email
      return await loginWithEmail(email, password);
    } catch (firestoreError: any) {
      console.error('Firestore query error:', firestoreError);
      
      // If the username is actually an email, try direct email login as fallback
      if (username.includes('@')) {
        console.log('Username appears to be an email, trying direct email login');
        return loginWithEmail(username, password);
      }
      
      if (firestoreError.code === 'permission-denied') {
        throw new Error('Failed to find user. Missing or insufficient permissions.');
      }
      
      throw firestoreError;
    }
  } catch (error: any) {
    handleFirebaseError(error, 'username login');
    throw error; // This should never execute due to handleFirebaseError, but TypeScript needs it
  }
};

export const registerUser = async (email: string, password: string, name: string, role: string, username?: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Store additional user data in Firestore
    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        email,
        name,
        role,
        username: username || email,
        createdAt: new Date()
      });
    } catch (firestoreError: any) {
      console.error('Firestore write error during registration:', firestoreError);
      
      if (firestoreError.code === 'permission-denied') {
        throw new Error('Failed to create user profile. Missing or insufficient permissions.');
      }
      
      throw firestoreError;
    }
    
    return {
      id: firebaseUser.uid,
      email,
      name,
      role: role as 'admin' | 'driver' | 'guardian'
    };
  } catch (error: any) {
    handleFirebaseError(error, 'registration');
    throw error; // This should never execute due to handleFirebaseError, but TypeScript needs it
  }
};

export const signOut = async (): Promise<void> => {
  return await firebaseSignOut(auth);
};

// Current user observer
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
