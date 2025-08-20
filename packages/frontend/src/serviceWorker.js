/**
 * TrustCare Connect - Service Worker
 * Progressive Web App functionality with healthcare-optimized caching
 */

const CACHE_NAME = 'trustcare-connect-v1.0.0';
const RUNTIME_CACHE = 'trustcare-runtime-v1.0.0';
const PRECACHE_URLS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/offline.html' // We'll create this fallback page
];

// URLs that should always be fetched from network (critical medical data)
const NETWORK_ONLY_URLS = [
  '/api/queries',
  '/api/patients', 
  '/api/doctors',
  '/api/responses',
  '/api/auth',
  '/api/medical-records'
];

// URLs that can be cached with network-first strategy
const NETWORK_FIRST_URLS = [
  '/api/system/stats',
  '/api/notifications',
  '/api/templates'
];

// Medical data expiration time (5 minutes for safety)
const MEDICAL_DATA_EXPIRY = 5 * 60 * 1000;

/**
 * Install Event - Cache essential resources
 */
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching essential resources');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[ServiceWorker] Installation complete');
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[ServiceWorker] Installation failed:', error);
      })
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete old versions of caches
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Activation complete');
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

/**
 * Fetch Event - Handle network requests with appropriate caching strategies
 */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle different URL patterns with appropriate strategies
  if (isNetworkOnlyUrl(url.pathname)) {
    event.respondWith(networkOnly(request));
  } else if (isNetworkFirstUrl(url.pathname)) {
    event.respondWith(networkFirst(request));
  } else if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

/**
 * Background Sync - Handle offline medical queries
 */
self.addEventListener('sync', event => {
  console.log('[ServiceWorker] Background sync triggered:', event.tag);
  
  if (event.tag === 'medical-query-sync') {
    event.waitUntil(syncMedicalQueries());
  }
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(syncNotifications());
  }
});

/**
 * Push Event - Handle push notifications
 */
self.addEventListener('push', event => {
  console.log('[ServiceWorker] Push received:', event);
  
  const options = {
    body: 'You have a new medical update.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1',
      url: '/'
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ],
    requireInteraction: true,
    tag: 'medical-notification'
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      options.title = payload.title || 'TrustCare Connect';
      options.body = payload.body || options.body;
      options.data = { ...options.data, ...payload.data };
      
      // Set urgency-based options
      if (payload.urgency === 'high') {
        options.requireInteraction = true;
        options.vibrate = [300, 100, 300, 100, 300];
      }
    } catch (error) {
      console.error('[ServiceWorker] Error parsing push payload:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification('TrustCare Connect', options)
  );
});

/**
 * Notification Click - Handle notification interactions
 */
self.addEventListener('notificationclick', event => {
  console.log('[ServiceWorker] Notification clicked:', event);
  
  const { notification, action } = event;
  const data = notification.data || {};
  
  event.notification.close();
  
  if (action === 'dismiss') {
    return;
  }
  
  // Default action or 'view' action
  const urlToOpen = data.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        // Focus existing tab if available
        for (const client of clients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new tab
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

/**
 * Caching Strategies
 */

// Network Only - Critical medical data that must be fresh
async function networkOnly(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.error('[ServiceWorker] Network only request failed:', error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline.html');
      return offlineResponse || new Response('Offline - Please check your connection', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    }
    
    throw error;
  }
}

// Network First - Try network, fallback to cache (for system data)
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[ServiceWorker] Network first falling back to cache:', error);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Cache First - Static assets
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[ServiceWorker] Cache first request failed:', error);
    throw error;
  }
}

// Stale While Revalidate - Serve from cache, update in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(error => {
      console.log('[ServiceWorker] Stale while revalidate fetch failed:', error);
      return cachedResponse;
    });
  
  return cachedResponse || fetchPromise;
}

/**
 * Helper Functions
 */

function isNetworkOnlyUrl(pathname) {
  return NETWORK_ONLY_URLS.some(url => pathname.startsWith(url));
}

function isNetworkFirstUrl(pathname) {
  return NETWORK_FIRST_URLS.some(url => pathname.startsWith(url));
}

function isStaticAsset(pathname) {
  return pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff2?|ttf|eot|ico)$/);
}

/**
 * Background Sync Functions
 */

async function syncMedicalQueries() {
  try {
    console.log('[ServiceWorker] Syncing medical queries...');
    
    // Get stored queries from IndexedDB
    const storedQueries = await getStoredMedicalQueries();
    
    if (storedQueries.length === 0) {
      return;
    }
    
    for (const query of storedQueries) {
      try {
        const response = await fetch('/api/queries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(query.data)
        });
        
        if (response.ok) {
          await removeStoredMedicalQuery(query.id);
          console.log('[ServiceWorker] Query synced successfully:', query.id);
        }
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync query:', query.id, error);
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Medical query sync failed:', error);
  }
}

async function syncNotifications() {
  try {
    console.log('[ServiceWorker] Syncing notifications...');
    // Implementation for notification sync
  } catch (error) {
    console.error('[ServiceWorker] Notification sync failed:', error);
  }
}

// IndexedDB helpers for offline storage
async function getStoredMedicalQueries() {
  // TODO: Implement IndexedDB operations
  return [];
}

async function removeStoredMedicalQuery(id) {
  // TODO: Implement IndexedDB operations
}

/**
 * Cache Management
 */

// Clean old cache entries
async function cleanOldCacheEntries() {
  const cache = await caches.open(RUNTIME_CACHE);
  const requests = await cache.keys();
  const now = Date.now();
  
  for (const request of requests) {
    const response = await cache.match(request);
    const dateHeader = response.headers.get('date');
    
    if (dateHeader) {
      const cacheDate = new Date(dateHeader).getTime();
      
      // Remove medical data older than expiry time
      if (isNetworkFirstUrl(new URL(request.url).pathname) && 
          now - cacheDate > MEDICAL_DATA_EXPIRY) {
        await cache.delete(request);
        console.log('[ServiceWorker] Removed expired cache entry:', request.url);
      }
    }
  }
}

// Schedule cache cleanup
setInterval(cleanOldCacheEntries, 10 * 60 * 1000); // Every 10 minutes

/**
 * Error Handling and Logging
 */
self.addEventListener('error', event => {
  console.error('[ServiceWorker] Error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[ServiceWorker] Unhandled rejection:', event.reason);
});

console.log('[ServiceWorker] Service Worker registered successfully');