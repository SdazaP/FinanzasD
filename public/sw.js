// Service worker de Finanzas: deja abrir la app sin conexión. No guarda datos de Firebase ni de Google
// (Firestore tiene su propia caché local); solo la app (HTML, JS, CSS, íconos) y las fuentes.
const CACHE = 'finanzas-v1'
const FONTS = ['fonts.googleapis.com', 'fonts.gstatic.com']

// Al instalar se guarda la app completa: el JS y CSS ya cargaron antes de que existiera el service worker.
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      const html = await fetch('/', { cache: 'no-cache' })
      const assets = [...new Set((await html.clone().text()).match(/\/assets\/[^"']+/g) ?? [])]
      await cache.put('/', html)
      await cache.addAll([...assets, '/manifest.webmanifest', '/icon.svg', '/icon-192.png'])
    })(),
  )
})

// shortcut: no se borran los archivos de versiones anteriores (pesan poco); limpiar si la caché crece mucho
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

// El aviso "Hay una versión nueva" pide activar la versión que espera
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  if (url.origin === self.location.origin) {
    // El HTML siempre intenta la red para no quedarse en una versión vieja; sin conexión, el guardado
    if (request.mode === 'navigate') return event.respondWith(networkFirst(request))
    // Los archivos con hash no cambian: caché primero
    if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icon')) return event.respondWith(cacheFirst(request))
    return
  }
  if (FONTS.includes(url.hostname)) event.respondWith(staleWhileRevalidate(request))
})

async function networkFirst(request) {
  const cache = await caches.open(CACHE)
  try {
    const response = await fetch(request)
    // Toda ruta de la app es el mismo index.html: se guarda una sola vez como '/'
    if (response.ok) cache.put('/', response.clone())
    return response
  } catch {
    return (await cache.match('/')) ?? Response.error()
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) cache.put(request, response.clone())
  return response
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE)
  const cached = await cache.match(request)
  const fresh = fetch(request)
    .then((response) => {
      // La hoja de estilos de Google Fonts llega como respuesta opaca (sin CORS): también se guarda
      if (response.ok || response.type === 'opaque') cache.put(request, response.clone())
      return response
    })
    .catch(() => cached ?? Response.error())
  return cached ?? fresh
}
