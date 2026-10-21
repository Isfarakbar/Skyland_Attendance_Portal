// Skyland Attendance Portal - Progressive Web App Service Worker (v5)
const CACHE_NAME = 'skyland-pwa-v5';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Never serve manifest or icons from stale SW cache so Android WebAPK SHA-256 icon verification always matches the server
  if (
    url.pathname.endsWith('manifest.json') ||
    url.pathname.includes('icon-') ||
    url.pathname.includes('skyland-icon') ||
    url.pathname.includes('apple-touch-icon') ||
    url.pathname.startsWith('/api/') ||
    event.request.mode === 'navigate'
  ) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Network-first with cache fallback for other assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
