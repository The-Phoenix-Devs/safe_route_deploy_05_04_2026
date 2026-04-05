import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { useToast } from '@/hooks/use-toast';

// Firebase configuration for messaging
const firebaseConfig = {
  apiKey: "AIzaSyCcX9sXvi_AIyAqhL1qPD0TY-e82mdXZHo",
  authDomain: "saferoute-99504.firebaseapp.com",
  projectId: "saferoute-99504",
  storageBucket: "saferoute-99504.firebasestorage.app",
  messagingSenderId: "746687651452",
  appId: "1:746687651452:web:42d8e60fa6400ffb3f33f9",
  measurementId: "G-9G80QE4D28"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
let messaging: any = null;

// Only initialize messaging in browser environment
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.error('Firebase messaging initialization failed:', error);
  }
}

// Prefer env (Firebase → Project settings → Cloud Messaging → Web Push certificates)
const vapidKeyFallback =
  "BDXs7VCyQkQnckD8JN2jTGpP4l3R6U9z3wX7hhHlVfQg3Zz5rN7gR5r_D8pM3xF7Y2E8uL9w4hR9sV8k1b3H2pL6";
const vapidKey =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim()) ||
  vapidKeyFallback;

export interface NotificationConfig {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}

export class FirebaseNotificationService {
  private static instance: FirebaseNotificationService;

  private constructor() {}

  static getInstance(): FirebaseNotificationService {
    if (!FirebaseNotificationService.instance) {
      FirebaseNotificationService.instance = new FirebaseNotificationService();
    }
    return FirebaseNotificationService.instance;
  }

  // Request permission for notifications
  async requestPermission(): Promise<string | null> {
    if (!messaging) {
      console.error('Firebase messaging not initialized');
      return null;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        
        // Get registration token
        const token = await getToken(messaging, { vapidKey });
        console.log('Registration token:', token);
        
        // Store token in Supabase for this user
        await this.storeTokenInSupabase(token);
        
        return token;
      } else {
        console.log('Unable to get permission to notify.');
        return null;
      }
    } catch (error) {
      console.error('An error occurred while retrieving token:', error);
      return null;
    }
  }

  // Store FCM token in Supabase
  private async storeTokenInSupabase(token: string) {
    const userData =
      (typeof localStorage !== "undefined" &&
        localStorage.getItem("sishu_tirtha_user")) ||
      (typeof sessionStorage !== "undefined" &&
        sessionStorage.getItem("sishu_tirtha_user"));
    if (!userData) return;

    try {
      const user = JSON.parse(userData);
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { error } = await supabase
        .from("profiles")
        .update({
          fcm_token: token,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq("id", user.id);

      if (error) {
        console.error("Failed to store FCM token:", error);
      } else {
        console.log("FCM token stored in profiles");
      }

      if (user.user_type === "guardian") {
        const { error: rpcErr } = await supabase.rpc("upsert_guardian_push_token", {
          p_profile_id: user.id,
          p_token: token,
          p_platform: "web",
        });
        if (rpcErr) {
          console.warn("upsert_guardian_push_token:", rpcErr.message);
        }
      }
    } catch (error) {
      console.error('Failed to store FCM token:', error);
    }
  }

  // Listen for foreground messages
  onMessage(callback: (payload: MessagePayload) => void) {
    if (!messaging) return;
    
    return onMessage(messaging, callback);
  }

  // Send notification to specific user
  async sendNotificationToUser(userId: string, notification: NotificationConfig) {
    try {
      // This would typically be done through a backend service
      // For now, we'll use Supabase Edge Function
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId,
          notification
        }
      });

      if (error) throw error;
      console.log('Notification sent successfully');
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  // Send notification to all users of a specific type
  async sendNotificationToUserType(userType: string, notification: NotificationConfig) {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userType,
          notification
        }
      });

      if (error) throw error;
      console.log('Notification sent to all', userType, 'users');
    } catch (error) {
      console.error('Failed to send notification to user type:', error);
    }
  }
}

// React hook for using Firebase notifications
export const useFirebaseNotifications = () => {
  const { toast } = useToast();
  const notificationService = FirebaseNotificationService.getInstance();

  const initializeNotifications = async () => {
    const token = await notificationService.requestPermission();
    
    if (token) {
      // Listen for foreground messages
      notificationService.onMessage((payload) => {
        console.log('Message received in foreground:', payload);
        
        // Show toast notification
        toast({
          title: payload.notification?.title || 'New Notification',
          description: payload.notification?.body || 'You have a new message',
        });
      });
    }
    
    return token;
  };

  const sendNotification = async (userId: string, notification: NotificationConfig) => {
    await notificationService.sendNotificationToUser(userId, notification);
  };

  const sendNotificationToType = async (userType: string, notification: NotificationConfig) => {
    await notificationService.sendNotificationToUserType(userType, notification);
  };

  return {
    initializeNotifications,
    sendNotification,
    sendNotificationToType
  };
};