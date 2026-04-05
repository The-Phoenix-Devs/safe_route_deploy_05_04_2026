// Firebase service worker for background notifications
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration
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
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/bus-icon.svg',
    badge: '/bus-icon.svg',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

function safeOpenPathFromData(data) {
  var raw = (data && (data.url || data.click_url)) || '';
  if (typeof raw !== 'string' || !raw.length) {
    return '/';
  }
  try {
    var origin = self.location.origin;
    var u = new URL(raw, origin);
    if (u.origin !== new URL(origin).origin) {
      return '/';
    }
    return u.pathname + u.search + u.hash;
  } catch (e) {
    return '/';
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('Notification click received.');

  event.notification.close();

  var path = safeOpenPathFromData(event.notification.data);
  event.waitUntil(clients.openWindow(path));
});