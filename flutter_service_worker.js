'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "assets/AssetManifest.json": "1f6c4de5e5516083748c41bf1a95b0f7",
"assets/assets/icons/discord_bn.png": "7968d06ec81ee0f70e5a1451c44b71c6",
"assets/assets/icons/facebook_bn.png": "293873dfb4bab467044fb3e4393bea32",
"assets/assets/icons/github_bn.png": "67c2a8768d1f0521f5f9c3a4378cbdff",
"assets/assets/icons/gmail_bn.png": "156fb094117cfc2253ecc7ed45bab530",
"assets/assets/icons/instagram_bn.png": "dcf8b83777fe55d79ca8e60dc1029f95",
"assets/assets/icons/linkedin_bn.png": "66f11d938f83e378499ae37a52797765",
"assets/assets/icons/skype_bn.png": "26bb38504af13263ed53e7c40844cf2e",
"assets/assets/icons/telegram_bn.png": "f25add223ce7143609c2f2651d8fd70a",
"assets/assets/icons/twitter_bn.png": "2003760a61710a5cfb078828120cba3c",
"assets/assets/images/portfolio.jpg": "508543f76744e3266e843019295d2b90",
"assets/FontManifest.json": "dcf65ae09784cd30cbbdd31cc406eab1",
"assets/fonts/MaterialIcons-Regular.otf": "a68d2a28c526b3b070aefca4bac93d25",
"assets/fonts%255CRaleway-Bold.ttf": "7802d8b27fcb19893ce6b38c0789268e",
"assets/fonts%255CRaleway-Italic.ttf": "f73026bcd64e5a5265ab616e5083cd48",
"assets/fonts%255CRaleway-Light.ttf": "6c084270ccdeb72fd9f5a5144cea628f",
"assets/fonts%255CRaleway-Regular.ttf": "75b4247fdd3b97d0e3b8e07b115673c2",
"assets/fonts%255CRobotoMono-Light.ttf": "fa8ab495d494eccb28f4431f054ddbd4",
"assets/fonts%255CRobotoMono-Regular.ttf": "e5ca8c0ac474df46fe45840707a0c483",
"assets/fonts%255CRobotoMono-Thin.ttf": "7cb58857d294ac1e09b72ea9403c690a",
"assets/NOTICES": "0ae216dc1e1caa09713955c495541ebc",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "115e937bb829a890521f72d2e664b632",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"index.html": "20b1b520f3ae7a577523e26b4ec4c078",
"/": "20b1b520f3ae7a577523e26b4ec4c078",
"main.dart.js": "207d9c4d854bbf5076785f75db235d4f",
"manifest.json": "c3b849cfdbd998c4f2509f4ce7127f8c"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      // Provide a 'reload' param to ensure the latest version is downloaded.
      return cache.addAll(CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');

      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }

      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#')) {
    key = '/';
  }
  // If the URL is not the RESOURCE list, skip the cache.
  if (!RESOURCES[key]) {
    return event.respondWith(fetch(event.request));
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache. Ensure the resources are not cached
        // by the browser for longer than the service worker expects.
        var modifiedRequest = new Request(event.request, {'cache': 'reload'});
        return response || fetch(modifiedRequest).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    return self.skipWaiting();
  }

  if (event.message === 'downloadOffline') {
    downloadOffline();
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey in Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
