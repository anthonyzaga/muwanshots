const CACHE_NAME = 'muwanshots-v5'; //bump version when updating

const ASSETS = [
    '/',
    '/index.html',
    '/site.webmanifest',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// INSTALL → cache core files + force activation
self.addEventListener('install', (event) => {
    self.skipWaiting(); // FORCE NEW SW TO TAKE OVER

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

// ACTIVATE → clean old caches + claim clients
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            caches.keys().then((keys) =>
                Promise.all(
                    keys.map((key) => {
                        if (key !== CACHE_NAME) return caches.delete(key);
                    })
                )
            ),
            self.clients.claim() // FORCE CONTROL OF OPEN TABS
        ])
    );
});

// FETCH → serve from cache first, then network
self.addEventListener('fetch', (event) => {
    const req = event.request;

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

    event.respondWith(
        caches.match(req).then((cached) => cached || fetch(req))
    );
});