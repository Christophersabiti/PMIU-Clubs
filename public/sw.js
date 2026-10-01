// PMI Uganda Clubs service worker: offline fallback + cache-first for static assets.
const CACHE = "pmiu-v1";
const OFFLINE = "/offline.html";
const PRECACHE = [OFFLINE, "/brand/pmi-uganda-logo-white.png", "/icons/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
    return;
  }
  if (url.origin === location.origin && (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/images") || url.pathname.startsWith("/brand"))) {
    e.respondWith(
      caches.match(req).then(
        (hit) => hit || fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; }),
      ),
    );
  }
});
