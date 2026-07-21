/* CarbonSmart Service Worker
   Scope-relative so it works whether the app is served at "/" or under a
   sub-path like "/carbonsmart/". Paths are derived from the SW's own scope. */
const CACHE_NAME = 'carbonsmart-v2'

/* Base path = the registration scope's pathname (e.g. "/" or "/carbonsmart/"). */
const BASE = new URL(self.registration.scope).pathname
const INDEX = `${BASE}index.html`
const STATIC_ASSETS = [BASE, INDEX, `${BASE}manifest.json`]

/* Install — cache static shell (ignore individual failures) */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(STATIC_ASSETS.map((a) => cache.add(a)))
    )
  )
  self.skipWaiting()
})

/* Activate — clean old caches (purges the old carbonsmart-v1 shell) */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

/* Fetch strategy:
   - API calls: network-first, fallback to cache
   - Navigation: network-first, SPA fallback to cached index.html
   - Static assets: cache-first
*/
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  /* API: network-first */
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return res
        })
        .catch(() => caches.match(request).then((cached) => cached ?? new Response(
          JSON.stringify({ error: 'Offline — cached data unavailable' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )))
    )
    return
  }

  /* Navigation: network-first so fresh deploys are picked up; SPA fallback offline */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(INDEX).then((cached) => cached ?? fetch(INDEX))
      )
    )
    return
  }

  /* Assets: cache-first */
  event.respondWith(
    caches.match(request).then((cached) => cached ?? fetch(request).then((res) => {
      const clone = res.clone()
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
      return res
    }))
  )
})

/* Sync event — triggered when back online */
self.addEventListener('sync', (event) => {
  if (event.tag === 'cs-sync-queue') {
    event.waitUntil(
      self.clients.matchAll().then((clients) =>
        clients.forEach((client) => client.postMessage({ type: 'SYNC_TRIGGERED' }))
      )
    )
  }
})
