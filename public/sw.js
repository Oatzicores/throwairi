// Minimal offline-support service worker for ThrowAirI.
// Strategy: cache-first for static assets/icons, network-first (falling back
// to cache) for pages — the catalog/news data changes, so pages should
// always try the network first and only fall back when offline.
// Renamed from "ai-finder-v1": the activate step deletes every cache whose name
// differs, which also purges pages an older version cached with visitors'
// request text in the URL.
const CACHE_NAME = "throwairi-v2";
const APP_SHELL = ["/", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          }),
      ),
    );
    return;
  }

  // Never store URLs with a query string (e.g. /results?q=<what the visitor
  // typed>) or API responses: the cache would keep private text on the device.
  const cacheable = !url.search && !url.pathname.startsWith("/api/");

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (cacheable && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/"))),
  );
});
