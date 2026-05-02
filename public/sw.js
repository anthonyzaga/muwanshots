const CACHE_NAME = 'muwanshots-v1';

const ASSETS = [
    '/',
    '/index.html',
    '/site.webmanifest',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// INSTALL → cache core files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

// ACTIVATE → clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            )
        )
    );
});

// FETCH → serve from cache first, then network
self.addEventListener('fetch', (event) => {
    const req = event.request;

    // 🖼️ Handle images (important for your gallery)
    if (req.destination === 'image') {
        event.respondWith(
            caches.match(req).then((cached) => {
                return (
                    cached ||
                    fetch(req).then((res) => {
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

    // Default: cache-first
    event.respondWith(
        caches.match(req).then((cached) => cached || fetch(req))
    );
});