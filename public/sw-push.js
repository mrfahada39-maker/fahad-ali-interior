const APP_NAME = 'Fahad Ali Interior';
const DEFAULT_ICON = '/icons/icon-192.png';
const DEFAULT_BADGE = '/icons/icon-192.png';

let VAPID_PUBLIC_KEY = null;

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