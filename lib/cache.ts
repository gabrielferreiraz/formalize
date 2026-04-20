const cache = new Map<string, { buffer: Buffer; mime: string; cachedAt: number }>();
const TTL = 1000 * 60 * 60; // 1 hora

export async function fetchWithCache(
  url: string,
): Promise<{ buffer: Buffer; mime: string }> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.cachedAt < TTL) {
    console.log("cache HIT:", url);
    return { buffer: cached.buffer, mime: cached.mime };
  }
  console.log("cache MISS:", url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${url} (${res.status})`);
  const mime = res.headers.get("content-type") || "application/octet-stream";
  const buffer = Buffer.from(await res.arrayBuffer());
  cache.set(url, { buffer, mime, cachedAt: Date.now() });
  return { buffer, mime };
}
