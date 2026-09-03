const APP_NAME = 'Fahad Ali Interior';
const DEFAULT_ICON = '/logo.svg';
const DEFAULT_BADGE = '/logo.svg';
const OFFLINE_CACHE_NAME = 'fahad-ali-offline-v3';
const OFFLINE_ASSETS = ['/offline.html', '/logo.svg'];

let VAPID_PUBLIC_KEY = null;

// INSTALL: Precache standalone luxury offline page immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ACTIVATE: Clean up older caches & claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== OFFLINE_CACHE_NAME && !key.startsWith('workbox-')) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// FETCH: When online, ALWAYS serve live site. Only when network fails, serve offline.html
self.addEventListener('fetch', (event) => {
  if (event.request.method === 'GET' && event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(event.request);
          if (response) {
            return response;
          }
        } catch (error) {
          // Network failure (offline / no connection)
          try {
            const cache = await caches.open(OFFLINE_CACHE_NAME);
            const cachedOffline = await cache.match('/offline.html');
            if (cachedOffline) {
              return cachedOffline;
            }
          } catch (e) {}
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      })()
    );
  }
});

// receive key from frontend
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SET_VAPID_KEY') {
    VAPID_PUBLIC_KEY = event.data.key;
  }
});

// PUSH EVENT
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};

  try {
    data = event.data.json();
  } catch {
    data = {
      title: APP_NAME,
      body: event.data.text(),
    };
  }

  self.registration.showNotification(data.title || APP_NAME, {
    body: data.body || 'New Notification',
    icon: data.icon || DEFAULT_ICON,
    badge: data.badge || DEFAULT_BADGE,
    tag: data.tag || 'default',
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  });
});

// CLICK EVENT
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.openWindow(url)
  );
});

// SUBSCRIPTION CHANGE
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      if (!VAPID_PUBLIC_KEY) return;

      const subscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY,
      });

      await fetch('/api/v1/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });
    })()
  );
});