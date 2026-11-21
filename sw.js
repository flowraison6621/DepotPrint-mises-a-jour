// Garde le site et le moteur de lecture dans le téléphone : plus rapide, et marche sans réseau.
const CACHE = 'depotprix-202611211530'
self.addEventListener('install', e => { self.skipWaiting() })
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(l => Promise.all(l.filter(k => k !== CACHE && !k.startsWith('depotprix-lourd')).map(k => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url)
  if (e.request.method !== 'GET' || u.origin !== location.origin) return
  // gros fichiers (modèles, moteur) : gardés une fois pour toutes
  const lourd = /\/(modeles|ort)\//.test(u.pathname)
  const nom = lourd ? 'depotprix-lourd-1' : CACHE
  if (lourd) {
    e.respondWith(caches.open(nom).then(c => c.match(e.request).then(r => r || fetch(e.request).then(rep => { if (rep.ok) c.put(e.request, rep.clone()); return rep }))))
    return
  }
  // le reste : réseau d'abord (mises à jour), sinon ce qui est gardé
  e.respondWith(fetch(e.request).then(rep => { if (rep.ok) caches.open(nom).then(c => c.put(e.request, rep.clone())); return rep })
    .catch(() => caches.match(e.request)))
})
