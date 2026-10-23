/* STEM 8 service worker: makes the site installable and quick, without ever serving stale pages.
   Pages: network first (falls back to the saved copy offline). Icons and fonts: cache first.
   The photo locker and the Google Sheet are never cached here. */
const VERSION = "2026-10-22-0836";
const CACHE = "stem8-" + VERSION;
const CORE = ["./", "index.html", "favicon.svg", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "manifest.webmanifest"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET") return;
  const same = url.origin === location.origin;
  if (same && (url.pathname.includes("/locker/") || url.pathname.endsWith("photo-locker.html"))) return;
  if (req.mode === "navigate" || (same && url.pathname.endsWith(".html"))) {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put("index.html", copy)); return res; })
      .catch(() => caches.match("index.html").then(r => r || caches.match("./"))));
    return;
  }
  if (same || url.hostname.endsWith("fonts.gstatic.com") || url.hostname.endsWith("fonts.googleapis.com")) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => { if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })));
  }
});
