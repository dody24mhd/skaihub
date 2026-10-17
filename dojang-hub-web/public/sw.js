// SKAIHUB Service Worker - PWA Academy
const VERSION = "skaihub-v1";
const PRECACHE_NAME = `skaihub-precache-${VERSION}`;
const STATIC_CACHE_NAME = `skaihub-static-${VERSION}`;
const RUNTIME_CACHE_NAME = `skaihub-runtime-${VERSION}`;

const PRECACHE_ASSETS = [
  "/offline",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon-180.png",
  "/fonts/Inter-Regular.woff2",
  "/fonts/Inter-Medium.woff2",
  "/fonts/Inter-SemiBold.woff2",
  "/fonts/Inter-Bold.woff2",
  "/fonts/Montserrat-Regular.woff2",
  "/fonts/Montserrat-Medium.woff2",
  "/fonts/Montserrat-SemiBold.woff2",
  "/fonts/Montserrat-Bold.woff2",
  "/fonts/Montserrat-BoldItalic.woff2",
  "/fonts/Montserrat-Thin.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PRECACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (
              key !== PRECACHE_NAME &&
              key !== STATIC_CACHE_NAME &&
              key !== RUNTIME_CACHE_NAME
            ) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (!event.data) return;

  if (event.data === "SKIP_WAITING" || event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data.type === "LOGOUT") {
    event.waitUntil(caches.delete(RUNTIME_CACHE_NAME));
  }
});

self.addEventListener("fetch", (event) => {
  // Hanya tangani GET requests
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  // Lewatkan request lintas-origin (mis. API Laravel)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Lewatkan request ber-header Authorization
  if (event.request.headers.has("Authorization")) {
    return;
  }

  // Lewatkan request API
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // 1. Static Next.js assets (_next/static/*) -> Cache-first
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        })
      )
    );
    return;
  }

  // 2. Precached static assets (/offline, /icons/*, /fonts/*) -> Cache-first
  if (
    url.pathname === "/offline" ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/fonts/")
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request);
      })
    );
    return;
  }

  // 3. Navigasi / rute di bawah /academy* -> Network-first dengan fallback /offline
  // PENTING: Respons HTML TIDAK disimpan dalam cache
  if (url.pathname.startsWith("/academy")) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const offlinePage = await caches.match("/offline");
        return (
          offlinePage ||
          new Response("Anda sedang offline", {
            status: 503,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          })
        );
      })
    );
    return;
  }

  // Semua path lainnya (compro, landing akademi, dll.) -> return tanpa respondWith
  return;
});
