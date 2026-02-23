// public/sw.js

self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', function (event) {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { title: 'Notificación', body: event.data.text() };
  }

  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icon-192x192.png',
    badge: payload.badge || '/badge-96x96.png',
    tag: payload.tag || 'booking-notification',
    data: payload.data || {},
    requireInteraction: true,
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Notificación', options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        for (const client of clientList) {
          if (client.url.includes('/notifications') && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/notifications');
        }
      })
  );
});
