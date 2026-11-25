// Caches the app so it works offline. Bump VERSION when files change.
const VERSION = 'deck-v1';
const FILES = ["./", "index.html", "style.css", "data.js", "app.js", "manifest.json", "icon-192.png", "icon-512.png", "cards/A1.webp", "cards/A10.webp", "cards/A2.webp", "cards/A3.webp", "cards/A4.webp", "cards/A5.webp", "cards/A6.webp", "cards/A7.webp", "cards/A8.webp", "cards/A9.webp", "cards/C1.webp", "cards/C10.webp", "cards/C2.webp", "cards/C3.webp", "cards/C4.webp", "cards/C5.webp", "cards/C6.webp", "cards/C7.webp", "cards/C8.webp", "cards/C9.webp", "cards/G1.webp", "cards/G10.webp", "cards/G2.webp", "cards/G3.webp", "cards/G4.webp", "cards/G5.webp", "cards/G6.webp", "cards/G7.webp", "cards/G8.webp", "cards/G9.webp", "cards/L1.webp", "cards/L10.webp", "cards/L2.webp", "cards/L3.webp", "cards/L4.webp", "cards/L5.webp", "cards/L6.webp", "cards/L7.webp", "cards/L8.webp", "cards/L9.webp", "cards/U1.webp", "cards/U10.webp", "cards/U2.webp", "cards/U3.webp", "cards/U4.webp", "cards/U5.webp", "cards/U6.webp", "cards/U7.webp", "cards/U8.webp", "cards/U9.webp", "cards/W1.webp", "cards/W2.webp"];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request)));
});
