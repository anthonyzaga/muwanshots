const CACHE_NAME = 'muwanshots-v6';
const GALLERY_CACHE = 'muwanshots-gallery-v1';
const GALLERY_MAX_ENTRIES = 80;

const ASSETS = [
    '/',
    '/index.html',
    '/site.webmanifest',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            caches.keys().then((keys) =>
                Promise.all(
                    keys.map((key) => {
                        if (key !== CACHE_NAME && key !== GALLERY_CACHE) return caches.delete(key);
                    })
                )
            ),
            self.clients.claim()
        ])
    );
});

async function trimGalleryCache() {
  const cache = await caches.open(GALLERY_CACHE);
  const keys = await cache.keys();
  if (keys.length > GALLERY_MAX_ENTRIES) {
    // delete oldest entries (first in keys)
    const toDelete = keys.slice(0, keys.length - GALLERY_MAX_ENTRIES);
    await Promise.all(toDelete.map(req => cache.delete(req)));
  }
}

self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);

    // Never cache admin or API — always network, no store
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin/')) {
        return;
    }

    // HTML navigation — NetworkFirst to avoid stale SPA shell
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req).then(res => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(req, res.clone());
                    return res;
                });
            }).catch(() => caches.match(req).then(cached => cached || caches.match('/index.html')))
        );
        return;
    }

    // Gallery images — CacheFirst with bounded LRU (immutable hash URLs)
    if (url.pathname.startsWith('/images/gallery/')) {
        event.respondWith(
            caches.open(GALLERY_CACHE).then(cache =>
                cache.match(req).then(cached => {
                    if (cached) return cached;
                    return fetch(req).then(res => {
                        // only cache successful responses
                        if (res.ok) {
                            cache.put(req, res.clone());
                            // trim after put (async, don't block)
                            trimGalleryCache();
                        }
                        return res;
                    });
                })
            )
        );
        return;
    }

    // Other images — CacheFirst with main cache (bounded differently, but reuse gallery trim logic for simplicity)
    if (req.destination === 'image') {
        event.respondWith(
            caches.match(req).then((cached) => {
                return (
                    cached ||
                    fetch(req).then((res) => {
                        // Don't cache opaque failures
                        if (!res.ok) return res;
                        return caches.open(CACHE_NAME).then((cache) => {
                            cache.put(req, res.clone());
                            return res;
                        });
                    })
                );
            })
        );
        return;
    }

    event.respondWith(
        caches.match(req).then((cached) => cached || fetch(req))
    );
});
