import { auth } from '@/config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { supabase } from '@/integrations/supabase/client';

export interface CreateUserParams {
  email: string;
  password: string;
  username: string;
  userType: 'admin' | 'driver' | 'guardian';
  name?: string;
}

export interface UserProfile {
  id: string;
  firebase_uid: string;
  username: string;
  email: string;
  user_type: string;
  created_at: string;
  updated_at: string;
}

// Create Firebase user and store profile in Supabase
export const createUserWithProfile = async (params: CreateUserParams): Promise<UserProfile> => {
  try {
    console.log('Creating Firebase user with email:', params.email);
    // Create Firebase user
    const userCredential = await createUserWithEmailAndPassword(auth, params.email, params.password);
    const firebaseUser = userCredential.user;
    console.log('Firebase user created successfully:', firebaseUser.uid);

    // Create profile in Supabase
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        firebase_uid: firebaseUser.uid,
        username: params.username,
        email: params.email,
        user_type: params.userType
      })
      .select()
      .single();

    if (error) {
      // If Supabase insertion fails, delete Firebase user
      await firebaseUser.delete();
      throw error;
    }

    return profile;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Get user profile from Supabase by Firebase UID
export const getUserProfile = async (firebaseUid: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('firebase_uid', firebaseUid)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
};

// Sign in user
export const signInUser = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

// Sign out user
export const signOutUser = async () => {
  return await signOut(auth);
};

// Get current Firebase token for Supabase RLS
export const getFirebaseToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  
  return await user.getIdToken();
};

// Set Supabase auth with Firebase token
export const setSupabaseAuth = async () => {
  const token = await getFirebaseToken();
  if (token) {
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: '', // Firebase handles refresh
    });
  }
};