const CACHE = 'lizz-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  // La página: siempre intenta la versión nueva; si no hay señal, usa la guardada
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => {
      const copia = res.clone(); caches.open(CACHE).then(c => c.put(r, copia)); return res;
    }).catch(() => caches.match(r)));
    return;
  }
  // Fuentes y fotos: muestra al instante la guardada y actualiza en segundo plano
  if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname) || u.pathname.includes('/fotos/')) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const guardada = await c.match(r);
      const red = fetch(r).then(res => {
        if (res.ok || res.type === 'opaque') c.put(r, res.clone());
        return res;
      }).catch(() => guardada);
      return guardada || red;
    }));
  }
});
