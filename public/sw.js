const CACHE_NAME = "basic850-v6";
const WORD_PICTURE_MANIFEST = "/illustrations/words/manifest.json";
const PHONEME_IDS = [
  "i-long", "i-short", "e", "ae", "uh", "a-long", "o-short", "aw-long", "u-short", "u-long", "er-long", "schwa",
  "ei", "ai", "oi", "ou", "au", "ear", "air", "ure", "p", "b", "t", "d", "k", "g", "f", "v", "theta", "eth",
  "s", "z", "sh", "zh", "h", "ch", "j-affricate", "m", "n", "ng", "l", "r", "y", "w", "ts", "dz", "tr", "dr",
];
const ALPHABET_ART = [
  "/illustrations/alphabet/alphabet-01-a-e.webp",
  "/illustrations/alphabet/alphabet-02-f-j.webp",
  "/illustrations/alphabet/alphabet-03-k-o.webp",
  "/illustrations/alphabet/alphabet-04-p-t.webp",
  "/illustrations/alphabet/alphabet-05-u-w.webp",
  "/illustrations/alphabet/alphabet-06-x-z.webp",
];
const REQUIRED_CORE = [
  "/",
  "/manifest.webmanifest",
  "/branding/ideal-city-club-logo.png",
  "/branding/ideal-city-wechat-qr.jpg",
  "/data/words.json",
  "/data/course.json",
  "/data/classics.json",
];
const OPTIONAL_MEDIA = [
  WORD_PICTURE_MANIFEST,
  ...ALPHABET_ART,
  ...PHONEME_IDS.map((id) => `/audio/phonemes/${id}.mp3`),
];

async function fetchIntoCache(cache, path) {
  try {
    const response = await fetch(path, { cache: "reload" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await cache.put(path, response);
    return;
  } catch (networkError) {
    // An offline update can reuse a verified response from the previous cache.
    const previous = await caches.match(path);
    if (!previous) throw networkError;
    await cache.put(path, previous);
  }
}

async function cacheRequiredResources(cache) {
  await Promise.all(REQUIRED_CORE.map((path) => fetchIntoCache(cache, path)));
}

async function cacheBuiltAppShell(cache) {
  const page = await cache.match("/");
  if (!page) throw new Error("The app shell HTML was not cached");
  const html = await page.text();
  const paths = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1]);
  if (paths.length === 0) throw new Error("No built JavaScript or CSS assets were found in the app shell");
  await Promise.all([...new Set(paths)].map((path) => fetchIntoCache(cache, path)));
}

async function cacheOptionalResources(cache, paths) {
  const uniquePaths = [...new Set(paths)];
  let failedCount = 0;

  // Small batches avoid flooding slower mobile connections during installation.
  for (let index = 0; index < uniquePaths.length; index += 16) {
    const batch = uniquePaths.slice(index, index + 16);
    const results = await Promise.allSettled(batch.map((path) => fetchIntoCache(cache, path)));
    failedCount += results.filter((result) => result.status === "rejected").length;
  }

  if (failedCount > 0) {
    console.warn(`[Basic 850] ${failedCount} optional offline assets will be retried when requested.`);
  }
}

async function readWordPicturePaths(cache) {
  const response = (await cache.match(WORD_PICTURE_MANIFEST)) || (await caches.match(WORD_PICTURE_MANIFEST));
  if (!response) return [];

  try {
    const manifest = await response.json();
    if (!Array.isArray(manifest.assets)) return [];
    return manifest.assets
      .map((item) => item?.filename)
      .filter((filename) => typeof filename === "string" && /^[a-z0-9_-]+\.svg$/i.test(filename))
      .map((filename) => `/illustrations/words/${filename}`);
  } catch (error) {
    console.warn("[Basic 850] Word-picture manifest could not be read; images will cache on first use.", error);
    return [];
  }
}

async function precacheLearningAssets() {
  const cache = await caches.open(CACHE_NAME);

  // A missing app/data resource must stop installation; optional media must not.
  await cacheRequiredResources(cache);
  await cacheBuiltAppShell(cache);
  await cacheOptionalResources(cache, OPTIONAL_MEDIA);
  const wordPicturePaths = await readWordPicturePaths(cache);
  await cacheOptionalResources(cache, wordPicturePaths);
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheLearningAssets().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;

  // Always check the network for page navigations so a newly deployed app shell
  // cannot be hidden indefinitely behind an older offline cache.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(event.request)) || (await caches.match("/"))),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    }),
  );
});
