import { supabase } from '@/integrations/supabase/client';
import { FirebaseNotificationService } from '@/lib/firebaseMessaging';

interface EnhancedNotificationConfig {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  priority?: 'high' | 'normal';
  category?: string;
  silent?: boolean;
  requireInteraction?: boolean;
  vibrate?: number[];
}

interface LocationAlert {
  type: 'emergency' | 'geofence' | 'speed' | 'route_deviation';
  location: { lat: number; lng: number };
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class EnhancedNotificationService {
  private static instance: EnhancedNotificationService;
  private firebaseService: FirebaseNotificationService;
  private notificationQueue: EnhancedNotificationConfig[] = [];
  private isProcessing = false;

  private constructor() {
    this.firebaseService = FirebaseNotificationService.getInstance();
  }

  static getInstance(): EnhancedNotificationService {
    if (!EnhancedNotificationService.instance) {
      EnhancedNotificationService.instance = new EnhancedNotificationService();
    }
    return EnhancedNotificationService.instance;
  }

  // Enhanced push notification with retries and fallback
  async sendPushNotification(
    userId: string, 
    config: EnhancedNotificationConfig,
    retries = 3
  ): Promise<boolean> {
    try {
      // Add to queue for processing
      this.notificationQueue.push(config);
      await this.processNotificationQueue();

      // Send via Firebase
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId,
          notification: {
            ...config,
            timestamp: Date.now(),
            priority: config.priority || 'normal'
          }
        }
      });

      if (error && retries > 0) {
        console.warn(`Notification failed, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.sendPushNotification(userId, config, retries - 1);
      }

      // Log notification
      await this.logNotification(userId, config);
      return !error;
    } catch (error) {
      console.error('Enhanced notification failed:', error);
      
      // Fallback to local notification
      if ('Notification' in window && Notification.permission === 'granted') {
        return this.showLocalNotification(config);
      }
      
      return false;
    }
  }

  // Real-time location-based alerts
  async sendLocationAlert(alert: LocationAlert, affectedUsers: string[]) {
    const notification: EnhancedNotificationConfig = {
      title: this.getAlertTitle(alert.type, alert.severity),
      body: alert.message,
      icon: '/bus-icon.svg',
      badge: '/bus-icon.svg',
      priority: alert.severity === 'critical' ? 'high' : 'normal',
      category: alert.type,
      requireInteraction: alert.severity === 'critical',
      vibrate: this.getVibrationPattern(alert.severity),
      data: {
        alertType: alert.type,
        location: alert.location,
        severity: alert.severity,
        timestamp: Date.now()
      }
    };

    // Send to all affected users
    const promises = affectedUsers.map(userId => 
      this.sendPushNotification(userId, notification)
    );

    await Promise.allSettled(promises);
    
    // Log alert in database
    await this.logAlert(alert, affectedUsers);
  }

  // Emergency notifications with highest priority
  async sendEmergencyAlert(
    driverId: string,
    busNumber: string,
    location: { lat: number; lng: number },
  ) {
    const { data: students, error } = await supabase
      .from("students")
      .select("guardian_profile_id")
      .eq("driver_id", driverId)
      .not("guardian_profile_id", "is", null);

    if (error) {
      console.error("sendEmergencyAlert: students query failed", error);
    }

    const guardianIds = [
      ...new Set(
        (students?.map((s) => s.guardian_profile_id).filter(Boolean) as string[]) || [],
      ),
    ];

    const emergencyBaseData = {
      alertType: "emergency",
      busNumber,
      driverId,
      location,
      timestamp: Date.now(),
    };

    const guardianNotification: EnhancedNotificationConfig = {
      title: "🚨 EMERGENCY ALERT",
      body: `Emergency reported on Bus #${busNumber}. Emergency services have been notified.`,
      icon: "/bus-icon.svg",
      badge: "/bus-icon.svg",
      priority: "high",
      category: "emergency",
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      data: { ...emergencyBaseData, url: "/guardian/dashboard" },
    };

    const adminPayload = {
      title: guardianNotification.title,
      body: guardianNotification.body,
      icon: guardianNotification.icon,
      badge: guardianNotification.badge,
      data: { ...emergencyBaseData, url: "/admin/dashboard" },
    };

    await Promise.allSettled([
      ...guardianIds.map((id) =>
        this.sendPushNotification(id, guardianNotification),
      ),
      this.firebaseService.sendNotificationToUserType("admin", adminPayload),
      this.firebaseService.sendNotificationToUserType(
        "guardian_admin",
        adminPayload,
      ),
    ]);

    await this.sendEmergencySMSAlerts(driverId, busNumber, location);
  }

  // Show local notification as fallback
  private showLocalNotification(config: EnhancedNotificationConfig): boolean {
    try {
      const notificationOptions: NotificationOptions = {
        body: config.body,
        icon: config.icon || '/bus-icon.svg',
        badge: config.badge || '/bus-icon.svg',
        requireInteraction: config.requireInteraction,
        silent: config.silent,
        tag: config.category,
        data: config.data
      };

      // Add vibrate if supported
      if ('vibrate' in navigator && config.vibrate) {
        navigator.vibrate(config.vibrate);
      }

      const notification = new Notification(config.title, notificationOptions);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Local notification failed:', error);
      return false;
    }
  }

  // Process notification queue
  private async processNotificationQueue() {
    if (this.isProcessing || this.notificationQueue.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      // Process up to 5 notifications at once
      const batch = this.notificationQueue.splice(0, 5);
      
      // Store in IndexedDB for offline support
      await this.storeNotificationsOffline(batch);
      
    } finally {
      this.isProcessing = false;
      
      // Continue processing if more notifications are queued
      if (this.notificationQueue.length > 0) {
        setTimeout(() => this.processNotificationQueue(), 100);
      }
    }
  }

  // Store notifications offline for later sync
  private async storeNotificationsOffline(notifications: EnhancedNotificationConfig[]) {
    try {
      if ('indexedDB' in window) {
        const dbName = 'SafeRouteNotifications';
        const request = indexedDB.open(dbName, 1);
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('notifications')) {
            const store = db.createObjectStore('notifications', { 
              keyPath: 'id', 
              autoIncrement: true 
            });
            store.createIndex('timestamp', 'timestamp');
            store.createIndex('category', 'category');
          }
        };

        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['notifications'], 'readwrite');
          const store = transaction.objectStore('notifications');
          
          notifications.forEach(notification => {
            store.add({
              ...notification,
              timestamp: Date.now(),
              synced: false
            });
          });
        };
      }
    } catch (error) {
      console.error('Failed to store notifications offline:', error);
    }
  }

  // Log notification in database
  private async logNotification(userId: string, config: EnhancedNotificationConfig) {
    try {
      await supabase
        .from('notification_logs')
        .insert({
          user_id: userId,
          title: config.title,
          body: config.body,
          category: config.category,
          priority: config.priority,
          data: config.data,
          tokens_sent: 1,
          fcm_response: { status: 'sent', timestamp: Date.now() }
        });
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }

  // Log alert in database (using existing panic_alerts table)
  private async logAlert(alert: LocationAlert, affectedUsers: string[]) {
    try {
      await supabase
        .from('panic_alerts')
        .insert({
          driver_id: affectedUsers[0], // First affected user as driver
          alert_type: alert.type,
          severity: alert.severity,
          message: alert.message,
          location_lat: alert.location.lat,
          location_lng: alert.location.lng,
          is_resolved: false,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log alert:', error);
    }
  }

  // Send emergency SMS alerts
  private async sendEmergencySMSAlerts(
    driverId: string,
    busNumber: string,
    location: { lat: number; lng: number },
  ) {
    try {
      const { data: students } = await supabase
        .from('students')
        .select('guardian_mobile, guardian_name, name')
        .eq('driver_id', driverId)
        .not('guardian_mobile', 'is', null);

      const emergencyMessage = `🚨 EMERGENCY ALERT - Bus #${busNumber} has reported an emergency. Location: https://maps.google.com/?q=${location.lat},${location.lng}. Emergency services notified. - Sishu Tirtha Safe Route`;

      // Send SMS to all guardians
      const smsPromises = students?.map(student => 
        supabase.functions.invoke('send-student-action-sms', {
          body: {
            student_name: student.name,
            guardian_name: student.guardian_name,
            guardian_mobile: student.guardian_mobile,
            action: 'emergency',
            time: new Date().toLocaleString(),
            bus_number: busNumber,
            driver_name: 'Driver',
            pickup_point: 'Emergency Location'
          }
        })
      ) || [];

      await Promise.allSettled(smsPromises);
    } catch (error) {
      console.error('Failed to send emergency SMS alerts:', error);
    }
  }

  // Helper methods
  private getAlertTitle(type: string, severity: string): string {
    const severityEmoji = {
      low: '🔵',
      medium: '🟡', 
      high: '🟠',
      critical: '🔴'
    }[severity] || '🔵';

    const typeText = {
      emergency: 'Emergency Alert',
      geofence: 'Location Alert',
      speed: 'Speed Alert',
      route_deviation: 'Route Alert'
    }[type] || 'Safety Alert';

    return `${severityEmoji} ${typeText}`;
  }

  private getVibrationPattern(severity: string): number[] {
    switch (severity) {
      case 'critical': return [200, 100, 200, 100, 200, 100, 200];
      case 'high': return [200, 100, 200];
      case 'medium': return [100, 50, 100];
      default: return [50];
    }
  }
}

export const enhancedNotificationService = EnhancedNotificationService.getInstance();
export type { EnhancedNotificationConfig, LocationAlert };