// Bypass Workbox for authenticated page routes.
//
// When Next.js redirects /admin/orcamento → /admin/onboarding inside a Server Component,
// Workbox's NetworkFirst strategy follows the redirect via fetch(), but the resulting
// request may fail (auth context lost across redirect) or return a non-2xx that Workbox
// treats as "failed". With no cache entry, Workbox returns no-response and the client
// gets a black screen followed by a history.replaceState throttling loop.
//
// This listener is prepended before Workbox's own fetch handler by @ducanh2912/next-pwa.
// By calling event.respondWith() here, we take ownership of the request and Workbox
// never sees it — the browser handles the full redirect chain natively.
self.addEventListener("fetch", (event: any) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  if (
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/super-admin")
  ) {
    event.respondWith(fetch(event.request));
  }
});
