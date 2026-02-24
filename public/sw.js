// public/sw.js

var CACHE_NAME = 'roncesvalles-shell-v1';

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  // Remove old caches from previous versions
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) { return key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); })
      );
    }).then(function () {
      return clients.claim();
    })
  );
});

// Network-first for navigation requests: try network, fall back to cache.
// This prevents the browser's built-in offline page from appearing when the
// phone wakes from sleep and the network is momentarily unavailable.
self.addEventListener('fetch', function (event) {
  // Only handle GET navigation requests (page loads)
  if (event.request.method !== 'GET') return;
  if (event.request.mode !== 'navigate') return;

  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        // Cache a copy of every successful navigation response
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(function () {
        // Network failed – serve whatever was cached for this URL, or fall
        // back to the cached root page so the app shell always loads.
        return caches.match(event.request).then(function (cached) {
          return cached || caches.match('/');
        });
      })
  );
});

self.addEventListener('push', function (event) {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { title: 'Notificación', body: event.data.text()+e };
  }

  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icon-transparent.png',
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
