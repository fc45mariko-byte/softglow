const CACHE = 'mochi-v4';
const CORE  = ['/', '/index.html', '/manifest.json', '/css/style.css',
               '/js/config.js', '/js/db.js', '/js/mochi.js', '/js/app.js',
               '/icons/mochi-neutral.png', '/icons/mochi-happy.png',
               '/icons/mochi-thinking.png', '/icons/mochi-cheer.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  if (url.includes('supabase') || url.includes('anthropic') || url.includes('fonts')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      });
      return cached || net;
    })
  );
});
