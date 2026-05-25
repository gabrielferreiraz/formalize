// On every SW activation, delete Workbox runtime caches so stale chunks
// from old deployments are never served after a new deploy.
// Workbox manages its own precache cleanup separately.
self.addEventListener("activate", (event: any) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => !k.includes("precache")).map((k) => caches.delete(k))
      )
    )
  );
});

// Bypass Workbox for authenticated sub-requests (RSC fetches, prefetches, etc.).
//
// Problem: Workbox's NetworkFirst strategy intercepts RSC fetches for /admin/* routes.
// When Next.js server-side redirect() returns a non-2xx response, Workbox treats it
// as a network failure, finds no cache fallback, and returns no-response — causing
// a black screen followed by a history.replaceState throttling loop.
//
// This listener is prepended before Workbox's own fetch handler by @ducanh2912/next-pwa,
// so event.respondWith() here takes ownership before Workbox sees the request.
//
// Navigate requests (full page loads / browser-followed HTTP redirects) are skipped —
// fetch(navigateRequest) throws TypeError in SW context. Workbox handles navigate
// requests fine: it follows the HTTP redirect and returns the final 200 HTML page.
self.addEventListener("fetch", (event: any) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/super-admin")
  ) {
    // Use a fresh fetch (not new Request from event.request) to avoid inheriting
    // any problematic request properties (e.g. redirect:'error' on RSC requests).
    // credentials:'include' ensures cookies are sent for auth.
    // .catch returns Response.error() instead of rejecting — prevents the
    // "FetchEvent promise was rejected" console error on transient network failures.
    event.respondWith(
      fetch(event.request.url, {
        headers: event.request.headers,
        credentials: "include",
        redirect: "follow",
      }).catch(() => Response.error())
    );
  }
});
