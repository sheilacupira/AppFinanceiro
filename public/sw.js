const CACHE_NAME = "financeiro-v1";

// Files to cache immediately
const INITIAL_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
];

// Install event - cache initial files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(INITIAL_CACHE).catch(() => {
        // If some files fail, continue (development builds might not have all files)
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests and external URLs
  if (request.method !== "GET") {
    return;
  }

  // For API/external requests: network first
  if (request.url.includes("http") && !request.url.includes(self.location.origin)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type === "error") {
            return response;
          }
          // Clone the response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then((response) => {
            return response || new Response("Offline - resource not available", {
              status: 503,
              statusText: "Service Unavailable",
              headers: new Headers({
                "Content-Type": "text/plain"
              })
            });
          });
        })
    );
  } else {
    // For local assets: cache first, fallback to network
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type === "error") {
              return response;
            }
            // Clone and cache
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
            return response;
          })
          .catch(() => {
            // Both cache and network failed
            return caches.match(request).then((response) => {
              return response || new Response("Offline - resource not available", {
                status: 503,
                statusText: "Service Unavailable",
                headers: new Headers({
                  "Content-Type": "text/plain"
                })
              });
            });
          });
      })
    );
  }
});

// Handle messages from clients
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
