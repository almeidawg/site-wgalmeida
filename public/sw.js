/**
 * Service Worker - Grupo WG Almeida
 * PWA com cache estratégico para performance
 * v2 - Corrigido erro de Cache.put()
 */

// const CACHE_NAME = 'wgalmeida-v2'; // eslint-disable-line no-unused-vars
const STATIC_CACHE = "wgalmeida-static-v2";
const DYNAMIC_CACHE = "wgalmeida-dynamic-v2";

// Recursos estáticos críticos para cache imediato
const STATIC_ASSETS = ["/", "/manifest.json", "/favicon.png"];

// Instalar Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Caching static assets");
        // Usar cache.add individualmente para evitar falha total
        return Promise.allSettled(
          STATIC_ASSETS.map((url) =>
            cache.add(url).catch(() => console.log("[SW] Skip cache:", url))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Ativar e limpar caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map((name) => {
              console.log("[SW] Deleting old cache:", name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Estratégia de cache: Stale-While-Revalidate para assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests não-GET
  if (request.method !== "GET") return;

  // Ignorar URLs externas (exceto fontes e CDN)
  if (
    !url.origin.includes(self.location.origin) &&
    !url.hostname.includes("fonts.googleapis.com") &&
    !url.hostname.includes("fonts.gstatic.com")
  ) {
    return;
  }

  // Estratégia baseada no tipo de recurso
  if (isStaticAsset(url.pathname)) {
    // Cache-First para assets estáticos
    event.respondWith(cacheFirst(request));
  } else if (isImageRequest(url.pathname)) {
    // Stale-While-Revalidate para imagens
    event.respondWith(staleWhileRevalidate(request));
  } else {
    // Network-First para páginas HTML
    event.respondWith(networkFirst(request));
  }
});

// Verifica se é asset estático (JS, CSS com hash)
function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/assets/") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".css")
  );
}

// Verifica se é imagem
function isImageRequest(pathname) {
  return (
    pathname.match(/\.(webp|jpg|jpeg|png|gif|svg|ico)$/i) ||
    pathname.startsWith("/images/")
  );
}

// Cache-First: Busca no cache primeiro, depois na rede
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    // Só cacheia respostas OK e do tipo basic (mesmo domínio)
    if (response.ok && response.type === "basic") {
      const cache = await caches.open(STATIC_CACHE);
      try {
        await cache.put(request, response.clone());
      } catch (e) {
        // Ignora erro de cache silenciosamente
      }
    }
    return response;
  } catch (error) {
    console.log("[SW] Cache-first failed:", error);
    return new Response("Offline", { status: 503 });
  }
}

// Network-First: Tenta rede primeiro, fallback para cache
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    // Só cacheia respostas OK (200) e tipo basic
    if (response.ok && response.status === 200 && response.type === "basic") {
      const cache = await caches.open(DYNAMIC_CACHE);
      try {
        await cache.put(request, response.clone());
      } catch (e) {
        // Ignora erro de cache silenciosamente
      }
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Fallback para página offline
    if (request.mode === "navigate") {
      return caches.match("/");
    }
    return new Response("Offline", { status: 503 });
  }
}

// Stale-While-Revalidate: Retorna cache e atualiza em background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then(async (response) => {
      // Só cacheia respostas OK e tipo basic
      if (response.ok && response.type === "basic") {
        try {
          await cache.put(request, response.clone());
        } catch (e) {
          // Ignora erro de cache silenciosamente
        }
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}
