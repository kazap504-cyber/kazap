// Service Worker - cache offline des assets statiques (PWA légère)
const CACHE_NAME = 'kazap-v9 13/08';
const ASSETS_TO_CACHE = ['/'];

// Domaines/chemins à NE JAMAIS mettre en cache (API, Firestore, temps réel, auth...)
const NO_CACHE_PATTERNS = [
  '/api/',
  'firestore.googleapis.com',
  'firebaseinstallations.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com'
];

function shouldSkipCache(request) {
  if (request.method !== 'GET') return true;
  const url = request.url;
  return NO_CACHE_PATTERNS.some(pattern => url.includes(pattern));
}

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS_TO_CACHE)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const request = e.request;

  // On laisse passer directement les requêtes API / temps réel (pas de cache)
  if (shouldSkipCache(request)) {
    e.respondWith(fetch(request));
    return;
  }

  e.respondWith(
    caches.match(request).then(cached =>
      cached || fetch(request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
        }
        return res;
      }).catch(() => cached)
    )
  );
});
