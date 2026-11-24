// Garde le site et le moteur de lecture dans le téléphone : plus rapide, et marche sans réseau.
const CACHE = 'depotprix-202611241910'
// la page a besoin de ces en-têtes dès son ouverture : le site se recharge une fois au premier lancement
self.addEventListener('install', e => { self.skipWaiting() })
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(l => Promise.all(l.filter(k => k !== CACHE && !k.startsWith('depotprix-lourd')).map(k => caches.delete(k)))).then(() => self.clients.claim()))
})
/** En-têtes qui permettent au moteur de lecture d'utiliser tous les cœurs du téléphone. */
function isoler(rep) {
  if (!rep || rep.status === 0 || rep.type === 'opaque') return rep
  const h = new Headers(rep.headers)
  h.set('Cross-Origin-Opener-Policy', 'same-origin')
  h.set('Cross-Origin-Embedder-Policy', 'require-corp')
  h.set('Cross-Origin-Resource-Policy', 'same-origin')
  return new Response(rep.body, { status: rep.status, statusText: rep.statusText, headers: h })
}

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url)
  if (e.request.method !== 'GET' || u.origin !== location.origin) return
  // gros fichiers (modèles, moteur) : gardés une fois pour toutes
  const lourd = /\/(modeles|ort)\//.test(u.pathname)
  const nom = lourd ? 'depotprix-lourd-1' : CACHE
  if (lourd) {
    e.respondWith(caches.open(nom).then(c => c.match(e.request).then(r => r || fetch(e.request).then(rep => { if (rep.ok) c.put(e.request, rep.clone()); return rep }))).then(isoler))
    return
  }
  // le reste : réseau d'abord (mises à jour), sinon ce qui est gardé
  e.respondWith(fetch(e.request).then(rep => { if (rep.ok) { const copie = rep.clone(); caches.open(nom).then(c => c.put(e.request, copie)) } return rep })
    .catch(() => caches.match(e.request)).then(isoler))
})
