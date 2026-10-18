// Lightweight bounded in-memory TTL cache with stampede protection.
// No external services (no Redis). Safe for Render restarts: contents are
// ephemeral; on cold start every key simply misses and falls back to the DB.
//
// Design goals:
//  - Bounded memory: MAX_ENTRIES cap with oldest-first eviction + TTL sweep.
//  - Stampede protection: concurrent requests for the same key share ONE loader.
//  - Tag + prefix invalidation for menu/stock/restaurant mutations.
//  - Stores pre-serialized JSON so cache hits skip re-serialization entirely.
//  - Never caches errors: loaders that throw leave no entry behind.
//  - No sensitive data: keys contain only resource ids / scopes, never tokens.

const MAX_ENTRIES = 500;
const SWEEP_INTERVAL_MS = 60_000;

/** key -> { json, expiresAt, tags:Set<string> } (Map preserves insertion order = eviction order) */
const entries = new Map();
/** key -> Promise resolving to { json, hit:false } — in-flight loader dedup */
const inflight = new Map();
/** key -> generation counter; bumped on invalidation so late loader results are discarded */
const generations = new Map();

const stats = { hits: 0, misses: 0, sets: 0, evictions: 0, invalidations: 0, expired: 0, errors: 0, stampedes: 0 };

/** Error carrying an HTTP status so loaders can signal 404/400 without caching the failure. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function bumpGeneration(key) {
  generations.set(key, (generations.get(key) || 0) + 1);
}

function evictIfNeeded(key) {
  while (entries.size >= MAX_ENTRIES && !entries.has(key)) {
    const oldest = entries.keys().next().value;
    entries.delete(oldest);
    stats.evictions++;
  }
}

/**
 * Get a cached JSON string or run the loader (deduplicated across concurrent callers).
 * Returns { json, hit } where hit=true means no database/loader work was done.
 */
export async function getOrSet(key, { ttlMs, tags = [] }, loader) {
  const now = Date.now();
  const hit = entries.get(key);
  if (hit) {
    if (hit.expiresAt > now) {
      stats.hits++;
      return { json: hit.json, hit: true };
    }
    entries.delete(key);
    stats.expired++;
  }

  stats.misses++;

  if (inflight.has(key)) {
    stats.stampedes++;
    return inflight.get(key); // share the single in-flight load
  }

  const generationAtStart = generations.get(key) || 0;
  const promise = (async () => {
    try {
      const data = await loader();
      const json = JSON.stringify(data);
      // Discard if the key was invalidated while the loader was running.
      if ((generations.get(key) || 0) === generationAtStart) {
        evictIfNeeded(key);
        entries.set(key, { json, expiresAt: Date.now() + ttlMs, tags: new Set(tags) });
        stats.sets++;
      }
      return { json, hit: false };
    } catch (err) {
      stats.errors++;
      throw err;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

/** Remove every entry carrying any of the given tags. Returns count removed. */
export function invalidateTags(...tags) {
  const wanted = tags.flat().filter(Boolean);
  if (!wanted.length) return 0;
  let removed = 0;
  for (const [key, entry] of entries) {
    if (wanted.some(t => entry.tags.has(t))) {
      entries.delete(key);
      bumpGeneration(key); // discard in-flight results for this key
      removed++;
    }
  }
  if (removed) stats.invalidations += removed;
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[CACHE] invalidated ${removed} entr${removed === 1 ? 'y' : 'ies'} for tags: ${wanted.join(', ')}`);
  }
  return removed;
}

/** Remove every entry whose key starts with the given prefix (e.g. 'food:rest:12'). */
export function invalidatePrefix(prefix) {
  let removed = 0;
  for (const key of entries.keys()) {
    if (key.startsWith(prefix)) {
      entries.delete(key);
      bumpGeneration(key);
      removed++;
    }
  }
  if (removed) stats.invalidations += removed;
  if (process.env.NODE_ENV !== 'production' && removed) {
    console.log(`[CACHE] invalidated ${removed} entr${removed === 1 ? 'y' : 'ies'} for prefix: ${prefix}`);
  }
  return removed;
}

/** Drop everything (used by midnight stock reset / flash-sale rotation and on error paths). */
export function flush() {
  const size = entries.size;
  for (const key of entries.keys()) bumpGeneration(key);
  entries.clear();
  stats.invalidations += size;
  if (process.env.NODE_ENV !== 'production' && size) {
    console.log(`[CACHE] flushed ${size} entries`);
  }
  return size;
}

export function getStats() {
  const total = stats.hits + stats.misses;
  return {
    ...stats,
    entries: entries.size,
    maxEntries: MAX_ENTRIES,
    hitRate: total > 0 ? `${Math.round((stats.hits / total) * 100)}%` : 'n/a',
  };
}

/** Periodically drop expired entries so TTL'd data never lingers in memory. */
const sweepTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of entries) {
    if (entry.expiresAt <= now) {
      entries.delete(key);
      stats.expired++;
    }
  }
}, SWEEP_INTERVAL_MS);
sweepTimer.unref?.();

/**
 * Express handler helper: serve a JSON payload through the cache.
 * Sets X-Cache: HIT|MISS and Cache-Control. Loader throws -> error response
 * (HttpError carries status), never cached.
 */
export async function sendCached(req, res, key, { ttlMs, tags = [], cacheControl = 'no-cache' }, loader) {
  try {
    const { json, hit } = await getOrSet(key, { ttlMs, tags }, loader);
    // getOrSet returns a pre-serialized JSON string; never re-stringify it.
    const body = typeof json === 'string' ? json : JSON.stringify(json);
    res.set('X-Cache', hit ? 'HIT' : 'MISS');
    if (cacheControl) res.set('Cache-Control', cacheControl);
    res.set('Vary', 'Accept-Encoding');
    try {
      const { createHash } = await import('crypto');
      const etag = '"' + createHash('sha1').update(body).digest('hex') + '"';
      res.set('ETag', etag);
      if (req.headers['if-none-match'] === etag) {
        return res.status(304).end();
      }
    } catch {}
    res.set('Content-Type', 'application/json; charset=utf-8');
    return res.send(body);
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    console.error(`[CACHE] loader failed for ${key}:`, err.message);
    res.status(500).json({ success: false, message: err.message });
  }
}
