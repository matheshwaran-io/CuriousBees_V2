importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const urlParams = new URLSearchParams(location.search);
const configStr = urlParams.get('config');

let firebaseConfig = {
  apiKey: "mock-api-key-for-build",
  authDomain: "mock-auth-domain-for-build",
  projectId: "mock-project-id-for-build",
  storageBucket: "mock-storage-bucket-for-build",
  messagingSenderId: "mock-sender-id-for-build",
  appId: "mock-app-id-for-build"
};

if (configStr) {
  try {
    firebaseConfig = JSON.parse(decodeURIComponent(configStr));
  } catch (e) {
    console.error('Failed to parse Firebase config in SW', e);
  }
}

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || 'CuriousBees Update';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new synergy notification.',
    icon: payload.notification?.image || '/logo.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  
  event.notification.close();
  
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If there's an open window, focus it and navigate
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          // Optional: navigate client to targetUrl if you want it to refresh/redirect
          return client.navigate(targetUrl);
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
