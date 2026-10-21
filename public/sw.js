// Skyland Attendance Portal - Progressive Web App Service Worker (v6)
const CACHE_NAME = 'skyland-pwa-v6';
const OFFLINE_FALLBACK_HTML = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Skyland Attendance Portal</title><style>body{background:#0B1120;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:20px}button{background:#FF6B00;color:#fff;border:none;padding:12px 24px;border-radius:12px;font-weight:bold;margin-top:16px}</style></head><body><div><h2>Skyland Attendance Portal</h2><p>Please check your internet connection and try again.</p><button onclick="location.reload()">Retry</button></div></body></html>';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/', '/?app=skyland-v6']).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_ACTIVATED_V6' });
        });
      })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Always fetch manifest and icons directly from network so WebAPK SHA-256 verification matches 100%
  if (
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.webmanifest') ||
    url.pathname.includes('icon-') ||
    url.pathname.includes('skyland-icon') ||
    url.pathname.includes('apple-touch-icon') ||
    url.pathname.startsWith('/api/')
  ) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        return cached || new Response('', { status: 503 });
      })
    );
    return;
  }

  // Network-first for HTML page navigations with valid offline fallback (required by Chrome PWA install check)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = (await caches.match(event.request)) || (await caches.match('/'));
          if (cached) return cached;
          return new Response(OFFLINE_FALLBACK_HTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        })
    );
    return;
  }

  // Network-first with cache fallback for static assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        return cached || new Response('', { status: 504 });
      })
  );
});
