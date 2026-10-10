/* ============ sw.js — Service Worker para Super Batalla Pokémon PWA ============
 * Estrategia de caché:
 * - Código y estructura (HTML, CSS, JS, manifest): Network-first con fallback a caché.
 * - Recursos estáticos inmutables (sprites, fuentes, iconos): Cache-first.
 * - Las peticiones no-GET, llamadas a APIs externas o dinámicas nunca se interceptan.
 * - Limpieza de cachés antiguas en la activación y skipWaiting en la instalación.
 */
const CODE_CACHE = 'sbp-code-v2';
const ART_CACHE = 'sbp-art-v2';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './manifest.webmanifest',
  './manifest.json',
  './assets/icons/icon-180.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/fonts/PixelifySans.ttf'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CODE_CACHE).then(cache => {
      return cache.addAll(PRECACHE_ASSETS);
    }).catch(err => {
      console.warn('[SW] Precache parcial:', err);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CODE_CACHE && k !== ART_CACHE).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Recursos de arte/sprites/fuentes/iconos: Cache-first
  const isStaticArt = /\/assets\/(pokemon|icons|fonts)\//.test(url.pathname);
  if (isStaticArt) {
    event.respondWith(
      caches.open(ART_CACHE).then(async cache => {
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(req, res.clone());
          return res;
        } catch {
          return hit || Response.error();
        }
      })
    );
    return;
  }

  // Código, HTML y estilos: Network-first con fallback a caché
  event.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CODE_CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(req);
        if (hit) return hit;
        if (req.mode === 'navigate') {
          return (await caches.match('./index.html')) || (await caches.match('./')) || Response.error();
        }
        return Response.error();
      })
  );
});
