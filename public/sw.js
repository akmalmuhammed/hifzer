const CACHE_NAME = "hifzer-app-v2";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/icon.png",
  "/apple-icon.png",
  "/quran",
  "/quran/glossary",
  "/quran/progress",
  "/quran/bookmarks",
  "/quran/read?view=compact&anon=1&surah=1&cursor=1",
  "/quran/read?view=list&anon=1&surah=1",
];

const QURAN_ROUTE_PREFIXES = [
  "/quran",
  "/quran/read",
  "/quran/glossary",
  "/quran/progress",
  "/quran/bookmarks",
  "/quran/surah/",
  "/quran/juz/",
];

const CACHEABLE_API_PREFIXES = [
  "/api/quran/",
];

async function cacheResponse(request, response) {
  if (!response || response.status !== 200) {
    return response;
  }
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
  return response;
}

async function handleNavigation(request) {
  const cache = await caches.open(CACHE_NAME);
  const url = new URL(request.url);

  try {
    const response = await fetch(request);
    await cacheResponse(request, response);
    return response;
  } catch {
    const exact = await cache.match(request);
    if (exact) {
      return exact;
    }

    if (QURAN_ROUTE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) {
      const quranFallback = await cache.match("/quran");
      if (quranFallback) {
        return quranFallback;
      }

      const readerFallback = await cache.match("/quran/read?view=compact&anon=1&surah=1&cursor=1");
      if (readerFallback) {
        return readerFallback;
      }
    }

    const homeFallback = await cache.match("/");
    return homeFallback || Response.error();
  }
}

async function handleCachedGet(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) {
    void fetch(request)
      .then((response) => cacheResponse(request, response))
      .catch(() => undefined);
    return cached;
  }

  const response = await fetch(request);
  await cacheResponse(request, response);
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);
  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  const staticAsset = /\.(?:css|js|mjs|png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/i.test(
    requestUrl.pathname,
  );
  const cacheableApi = CACHEABLE_API_PREFIXES.some((prefix) => requestUrl.pathname.startsWith(prefix));
  if (!staticAsset && !cacheableApi) {
    return;
  }

  event.respondWith(handleCachedGet(request));
});
