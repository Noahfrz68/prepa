/* Service worker de la version iPhone — MODÈLE.
 *
 * scripts/iphone.mjs en tire out-iphone/sw.js à chaque build, en remplaçant
 * la version, le sous-chemin du site et la liste des fichiers. Ce fichier-ci
 * n'est jamais servi tel quel.
 *
 * Stratégie : tout le site en cache à l'installation, puis toujours le cache
 * d'abord. L'app ne dépend ainsi jamais du réseau ; les données, elles, ne
 * passent pas par ici (elles sont dans IndexedDB).
 */

const VERSION = '__VERSION__'
const BASE = __BASE__
const ADRESSES = __ADRESSES__
const CACHE = `prepa-${VERSION}`

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(async (c) => {
      // Par lots : un seul `addAll` de plusieurs centaines de requêtes échoue
      // en entier au moindre accroc réseau.
      for (let i = 0; i < ADRESSES.length; i += 25) {
        await c.addAll(ADRESSES.slice(i, i + 25).map((a) => new Request(a, { cache: 'reload' })))
      }
    }),
  )
  // Pas de skipWaiting ici : la nouvelle version attend que l'app la demande
  // (bouton « Mettre à jour »), pour ne pas changer de code en pleine série.
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((cles) => Promise.all(cles.filter((c) => c.startsWith('prepa-') && c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (e) => {
  if (e.data === 'activer') self.skipWaiting()
})

self.addEventListener('fetch', (e) => {
  const requete = e.request
  if (requete.method !== 'GET') return
  const url = new URL(requete.url)
  if (url.origin !== self.location.origin || !url.pathname.startsWith(`${BASE}/`)) return

  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      // Sans les paramètres : `/tagemage/drill/?section=calcul` est la page
      // `/tagemage/drill/`, et `?_rsc=…` ne change pas un fichier statique.
      let reponse = await cache.match(requete, { ignoreSearch: true })
      if (!reponse && requete.mode === 'navigate' && !url.pathname.endsWith('/')) {
        reponse = await cache.match(`${url.pathname}/`, { ignoreSearch: true })
      }
      if (reponse) return reponse
      try {
        return await fetch(requete)
      } catch {
        // Hors ligne et absent du cache : une page de l'app plutôt qu'une erreur du navigateur.
        if (requete.mode === 'navigate') return (await cache.match(`${BASE}/`)) ?? Response.error()
        return Response.error()
      }
    })(),
  )
})
