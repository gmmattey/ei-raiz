const SHELL_CACHE = 'quanto-pilot-shell-v6'
const APP_BASE = self.location.pathname.replace(/\/sw\.js$/, '') || ''
const shellAsset = (path) => `${APP_BASE}${path}`
const SHELL_INDEX = shellAsset('/index.html')
const SHELL_ASSETS = [
  SHELL_INDEX,
  shellAsset('/app.js'),
  shellAsset('/sw.js'),
  shellAsset('/manifest.json'),
  shellAsset('/runtime-ui/styles.css'),
  shellAsset('/runtime-ui/components.js'),
  shellAsset('/icons/quanto-icon-192.png'),
  shellAsset('/icons/quanto-icon-512.png'),
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== SHELL_CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  if (event.request.mode === 'navigate') {
    event.respondWith(handleNavigation(event.request))
    return
  }

  if (url.origin === self.location.origin && SHELL_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirst(event.request))
  }
})

async function handleNavigation(request) {
  try {
    const response = await fetch(request)
    const cache = await caches.open(SHELL_CACHE)
    cache.put(SHELL_INDEX, response.clone())
    return response
  } catch {
    const cached = await caches.match(SHELL_INDEX)
    return cached || new Response('Offline', { status: 503 })
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(SHELL_CACHE)
    cache.put(request, response.clone())
  }
  return response
}
