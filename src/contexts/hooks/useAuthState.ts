
import { useState, useEffect } from 'react';
import { onAuthStateChange } from '@/services/firebase';
import { User } from '../types/auth.types';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // First, try to restore user from localStorage immediately
    const restoreUserFromStorage = () => {
      try {
        const storedUser = localStorage.getItem('sishuTirthaUser');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          console.log('Restored user from localStorage:', userData);
          setUser(userData);
          setLoading(false);
          return true; // User was restored
        }
      } catch (error) {
        console.error("Error retrieving stored user:", error);
        localStorage.removeItem('sishuTirthaUser');
      }
      return false; // No user was restored
    };

    // Restore user immediately if available
    const userRestored = restoreUserFromStorage();

    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      // Only set loading if user wasn't already restored
      if (!userRestored) {
        setLoading(true);
      }
      
      if (firebaseUser) {
        // Firebase user exists, ensure localStorage is in sync
        if (!userRestored) {
          restoreUserFromStorage();
        }
      } else {
        // Firebase user doesn't exist, but keep localStorage user if available
        // This allows for persistent login without Firebase session
        if (!userRestored) {
          setUser(null);
          setLoading(false);
        }
      }
    });
    
    // If no user was restored, finish loading after a short delay
    if (!userRestored) {
      setTimeout(() => setLoading(false), 100);
    }
    
    return () => unsubscribe();
  }, []);

  return { user, setUser, loading, setLoading };
};
