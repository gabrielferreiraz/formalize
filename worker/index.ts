// On every SW activation, clear runtime caches so stale chunks from old
// deployments are never served. Workbox manages precache cleanup separately.
self.addEventListener("activate", (event: any) => {
  event.waitUntil(
    Promise.all([
      (self as any).clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys.filter((k) => !k.includes("precache")).map((k) => caches.delete(k))
        )
      ),
    ])
  );
});
