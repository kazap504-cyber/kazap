/* ═══════════════════════════════════════════════════════════════
   PWA-1 (2026-08-15) — Service worker minimal KAZAP
   ─────────────────────────────────────────────────────────────
   Rôle : rendre l'application installable (PWA) et permettre un
   minimum de fonctionnement hors-ligne en mettant en cache la
   coquille de l'application (HTML, manifest, icônes).

   Ne PAS étendre ce fichier pour mettre en cache des réponses
   d'API, de paiement (FedaPay) ou d'authentification (Firebase) :
   ce service worker ne doit intercepter QUE les requêtes GET de
   même origine listées ci-dessous, jamais les appels réseau
   dynamiques (checkout, webhook, notifications temps réel), sous
   peine de servir des données périmées ou de casser ces flux.

   Ce bloc est enregistré depuis index.html via register("sw.js") (scope par
   défaut = dossier de ce fichier, cf. le script d'enregistrement déjà présent
   dans le <head>) qui gère déjà la détection de nouvelle version et le
   rechargement de la page via skipWaiting() + clients.claim() ci-dessous.
   ═══════════════════════════════════════════════════════════════ */

// kazapSwCacheName — nom du cache, versionné. Incrémenter (v2, v3, ...)
// à chaque changement de la liste KAZAP_SW_PRECACHE_URLS pour forcer
// le renouvellement du cache chez les utilisateurs déjà installés.
// [REVERT-SPLIT-01] (2026-08-29) — Retour à un fichier unique (index.html) :
// app.html est retiré de la coquille précachée, il n'existe plus.
const KAZAP_SW_CACHE_NAME = 'kazap-pwa-v1 05/09/2026';

// KAZAP_SW_PRECACHE_URLS — coquille minimale mise en cache à l'installation.
// PWA-2 (2026-08-15) — Chemins relatifs (sans "/" initial) : résolus depuis
// l'emplacement réel de sw.js, donc valables aussi bien sous le sous-dossier
// GitHub Pages (/kazap/) qu'à la racine d'un futur domaine dédié (kazap.bj).
// Un chemin absolu "/icon-48.png" pointerait à la racine du domaine et
// échouerait avec l'hébergement actuel (sous /kazap/).
const KAZAP_SW_PRECACHE_URLS = [
  './',
  'index.html',
  'boutique.html',
  'manifest.json',
  'manifest-boutique.json',
  'favicon-16.png',
  'favicon-32.png',
  'favicon-64.png',
  'icon-48.png',
  'icon-96.png',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'apple-touch-icon-152.png',
  'apple-touch-icon-120.png',
  'splash-iphone.png'
];

// --- Installation : pré-cache de la coquille + activation immédiate ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(KAZAP_SW_CACHE_NAME)
      .then((cache) => cache.addAll(KAZAP_SW_PRECACHE_URLS))
      .catch((err) => {
        // Un seul fichier manquant dans la liste ferait échouer tout le
        // cache.addAll() : on log l'erreur sans bloquer l'installation
        // du service worker (l'app reste installable même si la
        // coquille hors-ligne est incomplète).
        console.warn('[kazap sw] échec pré-cache install :', err && err.message);
      })
  );
  self.skipWaiting();
});

// --- Activation : purge des anciens caches KAZAP + prise de contrôle ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames
        .filter((name) => name.startsWith('kazap-pwa-') && name !== KAZAP_SW_CACHE_NAME)
        .map((name) => caches.delete(name))
    ))
  );
  self.clients.claim();
});

// --- Fetch : uniquement GET, même origine, hors coquille dynamique ---
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // On ne touche jamais aux requêtes non-GET (POST/PUT webhook FedaPay,
  // écritures Firestore, etc.) ni aux requêtes cross-origin (Google
  // Fonts, CDN Chart.js, CDN FedaPay, Firebase) : elles doivent
  // toujours passer par le réseau, jamais par ce cache.
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  // Pages HTML (navigation) : réseau en priorité pour toujours servir
  // la dernière version déployée ; repli sur le cache si hors-ligne.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseCopy = response.clone();
          caches.open(KAZAP_SW_CACHE_NAME).then((cache) => cache.put(request, responseCopy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('index.html')))
    );
    return;
  }

  // Autres fichiers de la coquille (manifest, icônes) : cache en
  // priorité, avec repli réseau si absent du cache.
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
