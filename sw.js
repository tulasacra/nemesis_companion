var CACHE_NAME = 'nemesis-v6';
var ASSETS = [
    './',
    './index.html',
    './style.css?v=20260309-bag-highlight-v3',
    './app.js?v=20260309-bag-highlight-v3',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

self.addEventListener('install', function (e) {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.filter(function (k) { return k !== CACHE_NAME; })
                    .map(function (k) { return caches.delete(k); })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function (e) {
    e.respondWith(
        fetch(e.request).then(function (response) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
                cache.put(e.request, clone);
            });
            return response;
        }).catch(function () {
            return caches.match(e.request);
        })
    );
});
