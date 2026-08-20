// SellerOS — No-op service worker
// Removed: stale-while-revalidate caching was causing white screens
// on iOS Home Screen launch. The app works fine without a SW.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
