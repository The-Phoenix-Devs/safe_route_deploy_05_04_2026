// Enhanced Service Worker for offline functionality and background location tracking
const CACHE_NAME = 'safe-route-cache-v3';
const OFFLINE_CACHE = 'safe-route-offline-v3';
const API_BASE_URL = 'https://ywtopehsluchunhaplvk.supabase.co';

// Assets to cache for offline use
const CACHE_ASSETS = [
  '/',
  '/login',
  '/admin',
  '/driver',
  '/guardian',
  '/manifest.json',
  '/bus-icon.svg',
  '/logo-placeholder.svg'
];

// Critical pages that work offline
const OFFLINE_PAGES = [
  '/login',
  '/offline'
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('Enhanced Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache app shell
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Caching app shell');
        return cache.addAll(CACHE_ASSETS);
      }),
      // Cache offline pages
      caches.open(OFFLINE_CACHE).then((cache) => {
        console.log('Caching offline pages');
        return cache.addAll(OFFLINE_PAGES);
      })
    ])
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Enhanced Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      clients.claim()
    ])
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests (except Supabase API)
  if (url.origin !== self.location.origin && !url.origin.includes('supabase.co')) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('Serving from cache:', request.url);
          return cachedResponse;
        }
        
        // Try to fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Cache the response for app shell resources
            if (CACHE_ASSETS.some(asset => request.url.includes(asset))) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
            }
            
            return response;
          })
          .catch(() => {
            console.log('Network failed, serving offline page');
            
            // Serve offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/login') ||
                     new Response(`
                       <!DOCTYPE html>
                       <html>
                         <head>
                           <title>Safe Route - Offline</title>
                           <meta name="viewport" content="width=device-width, initial-scale=1">
                           <style>
                             body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                             .offline-message { background: #f0f0f0; padding: 20px; border-radius: 8px; }
                           </style>
                         </head>
                         <body>
                           <div class="offline-message">
                             <h1>🚌 Safe Route</h1>
                             <h2>You're offline</h2>
                             <p>Please check your internet connection and try again.</p>
                             <button onclick="window.location.reload()">Retry</button>
                           </div>
                         </body>
                       </html>
                     `, {
                       status: 200,
                       headers: { 'Content-Type': 'text/html' }
                     });
            }
            
            // Return a generic offline response for other requests
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Enhanced background sync for multiple data types
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-location-sync') {
    event.waitUntil(syncLocationData());
  } else if (event.tag === 'emergency-sync') {
    event.waitUntil(syncEmergencyData());
  } else if (event.tag === 'notification-sync') {
    event.waitUntil(syncNotificationData());
  } else if (event.tag === 'photo-sync') {
    event.waitUntil(syncPhotoData());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  const defaultOptions = {
    body: 'You have a new notification',
    icon: '/bus-icon.svg',
    badge: '/bus-icon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/bus-icon.svg'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/bus-icon.svg'
      }
    ]
  };
  
  let options = defaultOptions;
  
  if (event.data) {
    try {
      const data = event.data.json();
      options = {
        ...defaultOptions,
        body: data.body || defaultOptions.body,
        title: data.title || 'Safe Route',
        icon: data.icon || defaultOptions.icon,
        image: data.image, // Rich media support
        data: { ...defaultOptions.data, ...data },
        vibrate: data.priority === 'high' ? [200, 100, 200, 100, 200] : defaultOptions.vibrate,
        requireInteraction: data.priority === 'high'
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(options.title || 'Safe Route', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        for (let client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Handle location tracking in background
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'START_BACKGROUND_TRACKING') {
    startBackgroundLocationTracking(event.data.userId, event.data.userType, event.data.busNumber, event.data.driverName);
  } else if (event.data && event.data.type === 'STOP_BACKGROUND_TRACKING') {
    stopBackgroundLocationTracking();
  }
});

let locationWatchId = null;
let trackingData = null;

function startBackgroundLocationTracking(userId, userType, busNumber, driverName) {
  trackingData = { userId, userType, busNumber, driverName };
  
  // Start location tracking
  if ('geolocation' in navigator) {
    locationWatchId = navigator.geolocation.watchPosition(
      (position) => {
        // Store location data for sync
        const locationData = {
          user_id: userId,
          user_type: userType,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
          bus_number: busNumber,
          driver_name: driverName,
          is_active: true
        };
        
        // Store in IndexedDB for offline support
        storeLocationData(locationData);
        
        // Try to sync immediately
        syncLocationData();
      },
      (error) => {
        console.error('Background geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000
      }
    );
  }
}

function stopBackgroundLocationTracking() {
  if (locationWatchId !== null) {
    navigator.geolocation.clearWatch(locationWatchId);
    locationWatchId = null;
  }
  trackingData = null;
}

// Store location data in IndexedDB
function storeLocationData(data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LocationDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['locations'], 'readwrite');
      const store = transaction.objectStore('locations');
      store.add({ ...data, id: Date.now() });
      resolve();
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('locations')) {
        const store = db.createObjectStore('locations', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
        store.createIndex('user_id', 'user_id');
      }
    };
  });
}

// Sync location data to server
async function syncLocationData() {
  try {
    // Get pending location data from IndexedDB
    const pendingData = await getPendingLocationData();
    
    for (const data of pendingData) {
      try {
        const response = await fetch(`${API_BASE_URL}/rest/v1/live_locations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3dG9wZWhzbHVjaHVuaGFwbHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTAxMzIsImV4cCI6MjA2Nzc4NjEzMn0.r2phUPLrxiZ5IN0-KR_aLhY7F69X4Vu3FLRBOY4jahQ',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          // Remove synced data from IndexedDB
          await removeLocationData(data.id);
        }
      } catch (error) {
        console.error('Failed to sync location data:', error);
      }
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}

// Get pending location data from IndexedDB
function getPendingLocationData() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LocationDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['locations'], 'readonly');
      const store = transaction.objectStore('locations');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };
    };
  });
}

// Remove synced location data
function removeLocationData(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LocationDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['locations'], 'readwrite');
      const store = transaction.objectStore('locations');
      store.delete(id);
      resolve();
    };
  });
}

// Sync emergency data when connection is restored
async function syncEmergencyData() {
  try {
    console.log('Syncing emergency data...');
    
    const pendingAlerts = await getFromIndexedDB('emergencyAlerts');
    
    for (const alert of pendingAlerts) {
      try {
        const response = await fetch(`${API_BASE_URL}/rest/v1/panic_alerts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3dG9wZWhzbHVjaHVuaGFwbHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTAxMzIsImV4cCI6MjA2Nzc4NjEzMn0.r2phUPLrxiZ5IN0-KR_aLhY7F69X4Vu3FLRBOY4jahQ'
          },
          body: JSON.stringify(alert)
        });
        
        if (response.ok) {
          await removeFromIndexedDB('emergencyAlerts', alert.id);
        }
      } catch (error) {
        console.error('Failed to sync emergency alert:', error);
      }
    }
  } catch (error) {
    console.error('Emergency sync failed:', error);
  }
}

// Sync notification data
async function syncNotificationData() {
  try {
    console.log('Syncing notification data...');
    
    const pendingNotifications = await getFromIndexedDB('notifications');
    
    for (const notification of pendingNotifications) {
      if (!notification.synced) {
        try {
          const response = await fetch(`${API_BASE_URL}/rest/v1/notification_logs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3dG9wZWhzbHVjaHVuaGFwbHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTAxMzIsImV4cCI6MjA2Nzc4NjEzMn0.r2phUPLrxiZ5IN0-KR_aLhY7F69X4Vu3FLRBOY4jahQ'
            },
            body: JSON.stringify(notification)
          });
          
          if (response.ok) {
            notification.synced = true;
            await updateInIndexedDB('notifications', notification);
          }
        } catch (error) {
          console.error('Failed to sync notification:', error);
        }
      }
    }
  } catch (error) {
    console.error('Notification sync failed:', error);
  }
}

// Sync photo data
async function syncPhotoData() {
  try {
    console.log('Syncing photo data...');
    
    const pendingPhotos = await getFromIndexedDB('photos');
    
    for (const photo of pendingPhotos) {
      if (!photo.synced) {
        try {
          const response = await fetch(`${API_BASE_URL}/rest/v1/pickup_drop_history`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3dG9wZWhzbHVjaHVuaGFwbHZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTAxMzIsImV4cCI6MjA2Nzc4NjEzMn0.r2phUPLrxiZ5IN0-KR_aLhY7F69X4Vu3FLRBOY4jahQ'
            },
            body: JSON.stringify(photo)
          });
          
          if (response.ok) {
            photo.synced = true;
            await updateInIndexedDB('photos', photo);
          }
        } catch (error) {
          console.error('Failed to sync photo:', error);
        }
      }
    }
  } catch (error) {
    console.error('Photo sync failed:', error);
  }
}

// Enhanced IndexedDB helper functions
async function getFromIndexedDB(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SafeRouteOffline', 2);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create stores if they don't exist
      const storeNames = ['emergencyAlerts', 'notifications', 'photos', 'locations'];
      storeNames.forEach(name => {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('synced', 'synced');
        }
      });
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains(storeName)) {
        resolve([]);
        return;
      }
      
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };
      
      getAllRequest.onerror = () => {
        reject(getAllRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function removeFromIndexedDB(storeName, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SafeRouteOffline', 2);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains(storeName)) {
        resolve();
        return;
      }
      
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => {
        resolve();
      };
      
      deleteRequest.onerror = () => {
        reject(deleteRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function updateInIndexedDB(storeName, data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SafeRouteOffline', 2);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains(storeName)) {
        resolve();
        return;
      }
      
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const putRequest = store.put(data);
      
      putRequest.onsuccess = () => {
        resolve();
      };
      
      putRequest.onerror = () => {
        reject(putRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Periodic sync every 30 seconds
setInterval(() => {
  if (trackingData) {
    syncLocationData();
  }
  
  // Sync other data types periodically when online
  if (navigator.onLine) {
    syncEmergencyData();
    syncNotificationData();
    syncPhotoData();
  }
}, 30000);