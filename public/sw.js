/**
 * Service Worker - Grupo WG Almeida
 * PWA com cache estrategico para performance
 * v4 - hardening contra cache de HTML em URLs de assets/imagens
 */

const CACHE_VERSION = "v4-2026-04-18-brand-icon";
const STATIC_CACHE = `wgalmeida-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `wgalmeida-dynamic-${CACHE_VERSION}`;

// Recursos estáticos críticos para cache imediato
const STATIC_ASSETS = ["/", "/manifest.json", "/favicon.png", "/images/icone.webp"];

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
    // Nunca cachear HTML em URL de asset estatico.
    if (isCacheableStaticResponse(request, response)) {
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
    // Só cacheia navegacao/paginas quando a resposta e realmente HTML.
    if (isCacheableNavigationResponse(request, response)) {
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
      // Nunca cachear HTML quando a URL esperada e de imagem.
      if (isCacheableImageResponse(request, response)) {
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

function getContentType(response) {
  return response.headers.get("content-type") || "";
}

function isBasicOkResponse(response) {
  return response.ok && response.status === 200 && response.type === "basic";
}

function isCacheableStaticResponse(request, response) {
  const contentType = getContentType(response);
  return isBasicOkResponse(response)
    && !contentType.includes("text/html")
    && !request.url.endsWith("/index.html");
}

function isCacheableNavigationResponse(request, response) {
  const contentType = getContentType(response);
  return isBasicOkResponse(response)
    && request.mode === "navigate"
    && contentType.includes("text/html");
}

function isCacheableImageResponse(request, response) {
  const contentType = getContentType(response);
  return isBasicOkResponse(response)
    && (contentType.startsWith("image/") || request.destination === "image");
}
