const CACHE_NAME = 'aguai-cache-v5'; // Increment version
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './assets/aguai/logo.png',
];

// Install service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Activate worker immediately
  );
});

// Activate event to clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all pages
  );
});

// Fetch event to serve from cache or network
self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  // For navigation requests, use a network-first strategy.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // For all other requests, use a cache-first strategy.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch from network, then cache it
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response. We can't check opaque (CDN) responses.
            if (!networkResponse || (networkResponse.status !== 200 && networkResponse.type !== 'opaque')) {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(err => {
            // Network request failed, try to find a match in the cache.
            return caches.match(event.request);
        });
      })
  );
});