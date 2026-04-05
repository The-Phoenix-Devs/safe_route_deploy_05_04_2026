class BackgroundLocationService {
  private serviceWorker: ServiceWorker | null = null;

  async initialize(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        
        if (registration.active) {
          this.serviceWorker = registration.active;
        } else if (registration.installing) {
          registration.installing.addEventListener('statechange', (e) => {
            const worker = e.target as ServiceWorker;
            if (worker.state === 'activated') {
              this.serviceWorker = worker;
            }
          });
        }

        // Request persistent notification permission for background tracking
        if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission();
        }

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  async startBackgroundTracking(
    userId: string, 
    userType: 'driver' | 'bus', 
    busNumber?: string, 
    driverName?: string
  ): Promise<void> {
    if (!this.serviceWorker) {
      await this.initialize();
    }

    // Register background sync (if supported)
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      // Background sync is available in some browsers
      if ('sync' in registration) {
        try {
          await (registration as any).sync.register('background-location-sync');
          console.log('Background sync registered successfully');
        } catch (error) {
          console.log('Background sync not supported:', error);
        }
      }
    }

    // Send message to service worker to start tracking
    if (this.serviceWorker) {
      this.serviceWorker.postMessage({
        type: 'START_BACKGROUND_TRACKING',
        userId,
        userType,
        busNumber,
        driverName
      });
      console.log('Background tracking started for:', { userId, userType, busNumber });
    }

    // Show notification for background tracking with enhanced options
    if (Notification.permission === 'granted') {
      const notification = new Notification('📍 Location Tracking Active', {
        body: `Safe Route is tracking ${userType} location for student safety`,
        icon: '/bus-icon.svg',
        badge: '/bus-icon.svg',
        requireInteraction: false,
        tag: 'location-tracking',
        silent: false
      });

      // Handle notification actions
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }

    // Save tracking state
    localStorage.setItem('backgroundTracking', JSON.stringify({
      active: true,
      userId,
      userType,
      busNumber,
      driverName,
      startTime: Date.now()
    }));
  }

  async stopBackgroundTracking(): Promise<void> {
    if (this.serviceWorker) {
      this.serviceWorker.postMessage({
        type: 'STOP_BACKGROUND_TRACKING'
      });
    }

    // Clear any existing notifications
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const notifications = await registration.getNotifications();
      notifications.forEach(notification => {
        if (notification.tag === 'location-tracking') {
          notification.close();
        }
      });
    }
  }

  isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'geolocation' in navigator &&
      'Notification' in window
    );
  }

  async requestPermissions(): Promise<boolean> {
    try {
      // Request location permission
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      // Request notification permission
      const notificationPermission = await Notification.requestPermission();

      return notificationPermission === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }
}

export const backgroundLocationService = new BackgroundLocationService();