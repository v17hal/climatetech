/* CarbonSmart Service Worker */
const CACHE_NAME = 'carbonsmart-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
]

/* Install — cache static shell */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

/* Activate — clean old caches */
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
   - Static assets: cache-first
   - Navigation: serve index.html (SPA fallback)
*/
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  /* API: network-first */
  if (url.pathname.startsWith('/api/')) {
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

  /* Navigation: SPA fallback */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html').then((cached) => cached ?? fetch('/index.html'))
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
