// Frontend response cache for public catalog GETs.
//
// Design:
//  - Plugged in as an axios *adapter* inside createApiClient(), so every page
//    benefits without touching individual call sites.
//  - Module-level singleton shared across all client instances.
//  - Only allowlisted GET paths are cached. Auth, cart, checkout, profile,
//    owner/admin endpoints are NEVER cached here (server handles those).
//  - SWR: fresh for `ttl`, then serves stale while revalidating in background,
//    then blocking fetch beyond `ttl + swr`.
//  - Stampede protection: concurrent identical requests share one network call.
//  - Epoch guard: each fetch gets a sequence number; results from fetches that
//    started before an invalidation (or before a newer fetch) are discarded
//    so outdated responses never overwrite newer data.
//  - Successful mutations auto-invalidate the catalog keys they affect.

import axios from 'axios';

// Platform default adapter (xhr in the browser, http in node, fetch fallback).
const platformAdapter = axios.getAdapter(
	axios.defaults.adapter || ['xhr', 'http', 'fetch']
);

const MAX_ENTRIES = 100;
const SWEEP_INTERVAL_MS = 60_000;
const MINUTE = 60_000;

// Allowlist: path (without query string) -> fresh window + stale window.
const CACHEABLE_RULES = [
	{ re: /^\/categories$/, ttl: 15 * MINUTE, swr: 15 * MINUTE },
	{ re: /^\/restaurants$/, ttl: 3 * MINUTE, swr: 3 * MINUTE },
	{ re: /^\/food$/, ttl: 3 * MINUTE, swr: 3 * MINUTE },
	{ re: /^\/food\/popular$/, ttl: 2 * MINUTE, swr: 2 * MINUTE },
	{ re: /^\/food\/flash-sale$/, ttl: 2 * MINUTE, swr: 2 * MINUTE },
	{ re: /^\/foods\/featured$/, ttl: 3 * MINUTE, swr: 3 * MINUTE },
	{ re: /^\/food\/budget-meal\/\d+$/, ttl: 2 * MINUTE, swr: 2 * MINUTE },
	{ re: /^\/food\/\d+$/, ttl: 3 * MINUTE, swr: 3 * MINUTE },
	{ re: /^\/reviews\/summary$/, ttl: 10 * MINUTE, swr: 10 * MINUTE },
	{ re: /^\/reviews\/menu-item\/\d+$/, ttl: 5 * MINUTE, swr: 5 * MINUTE },
];

// Successful mutations -> catalog prefixes to drop (paths start with prefix).
// Anything not listed (cart, favorites, profile, auth) invalidates nothing:
// it does not affect catalog data.
const MUTATION_INVALIDATIONS = [
	{ re: /\/orders\/create/, invalidate: ['/food', '/stock/'] },
	{ re: /\/reviews$/, invalidate: ['/reviews/summary', '/reviews/menu-item', '/food'] },
	{ re: /\/owner\/menu/, invalidate: ['/food', '/categories'] },
	{ re: /\/owner\/inventory/, invalidate: ['/food'] },
	{ re: /\/owner\/settings/, invalidate: ['/restaurants', '/food'] },
	{ re: /\/admin\/restaurants/, invalidate: ['/restaurants', '/food'] },
	{ re: /\/admin\/flash-sale/, invalidate: ['/food/flash-sale'] },
];

/** key -> { response, storedAt } (Map insertion order = eviction order) */
const entries = new Map();
/** key -> Promise of the in-flight network call */
const inflight = new Map();
/** key -> epoch counter; bumped on invalidation + new fetch start */
const seqs = new Map();

export const apiCacheStats = { hits: 0, staleHits: 0, network: 0, deduped: 0, invalidations: 0, discarded: 0 };

function matchRule(path) {
	for (const rule of CACHEABLE_RULES) {
		if (rule.re.test(path)) return rule;
	}
	return null;
}

function stripQuery(url) {
	const i = url.indexOf('?');
	return i === -1 ? url : url.slice(0, i);
}

function buildKey(config) {
	const path = stripQuery(config.url || '');
	let params = '';
	if (config.params && typeof config.params === 'object') {
		const sorted = Object.keys(config.params).sort();
		params = sorted.map((k) => `${k}=${encodeURIComponent(config.params[k])}`).join('&');
	}
	return params ? `${path}?${params}` : path;
}

function bumpSeq(key) {
	const next = (seqs.get(key) || 0) + 1;
	seqs.set(key, next);
	return next;
}

function evictIfNeeded(key) {
	while (entries.size >= MAX_ENTRIES && !entries.has(key)) {
		entries.delete(entries.keys().next().value);
	}
}

/** Fresh copy so axios' transform step mutates only this caller's object. */
function copyOf(response, config, fromCache) {
	return { ...response, config, fromCache };
}

function startFetch(key, config) {
	const mySeq = bumpSeq(key);
	const promise = platformAdapter(config)
		.then((response) => {
			if (response.status >= 200 && response.status < 300) {
				if (seqs.get(key) === mySeq) {
					evictIfNeeded(key);
					entries.set(key, { response: { ...response }, storedAt: Date.now() });
				} else {
					apiCacheStats.discarded++;
				}
			}
			return response;
		})
		.finally(() => {
			if (inflight.get(key) === promise) inflight.delete(key);
		});
	// Mark as handled so background revalidations never raise unhandled rejections.
	promise.catch(() => {});
	inflight.set(key, promise);
	return promise;
}

/**
 * Axios adapter: serves allowlisted GETs from the local cache, otherwise
 * delegates to the platform adapter. Mutations trigger auto-invalidation.
 */
export async function cachedAdapter(config) {
	const method = (config.method || 'get').toLowerCase();
	const path = stripQuery(config.url || '');
	const rule = method === 'get' ? matchRule(path) : null;

	if (!rule) {
		const response = await platformAdapter(config);
		if (method !== 'get' && response.status < 300) {
			for (const mutation of MUTATION_INVALIDATIONS) {
				if (mutation.re.test(path)) invalidateApiCache(mutation.invalidate);
			}
		}
		return response;
	}

	const key = buildKey(config);
	const entry = entries.get(key);
	const age = entry ? Date.now() - entry.storedAt : Infinity;

	// Fresh: serve locally, no network.
	if (entry && age < rule.ttl) {
		apiCacheStats.hits++;
		return copyOf(entry.response, config, true);
	}

	// Stale within swr window: serve locally AND revalidate in background.
	if (entry && age < rule.ttl + rule.swr) {
		apiCacheStats.staleHits++;
		if (!inflight.has(key)) startFetch(key, config);
		return copyOf(entry.response, config, true);
	}

	// Blocking fetch; join an identical in-flight call when possible.
	const pending = inflight.get(key);
	if (pending) {
		apiCacheStats.deduped++;
		const response = await pending;
		return copyOf(response, config, false);
	}
	apiCacheStats.network++;
	const response = await startFetch(key, config);
	return copyOf(response, config, false);
}

/**
 * Drop cached entries whose path starts with one of the given prefixes.
 * Call after mutations when auto-invalidation is not enough (e.g. raw axios).
 */
export function invalidateApiCache(prefixes) {
	const list = Array.isArray(prefixes) ? prefixes : [prefixes];
	if (!list.length) return 0;
	let removed = 0;
	for (const key of entries.keys()) {
		if (list.some((prefix) => key.startsWith(prefix))) {
			entries.delete(key);
			bumpSeq(key); // late in-flight results for this key get discarded
			removed++;
		}
	}
	apiCacheStats.invalidations += removed;
	return removed;
}

/** True when a NON-stale entry exists for this path (used to skip spinners). */
export function hasFreshApiResponse(url) {
	const entry = entries.get(stripQuery(url));
	if (!entry) return false;
	const rule = matchRule(stripQuery(url));
	if (!rule) return false;
	return Date.now() - entry.storedAt < rule.ttl;
}

/** Drop everything (logout / user switch hygiene). */
export function flushApiCache() {
	for (const key of entries.keys()) bumpSeq(key);
	const size = entries.size;
	entries.clear();
	inflight.clear();
	return size;
}

export function getApiCacheStats() {
	return { ...apiCacheStats, entries: entries.size, maxEntries: MAX_ENTRIES };
}

const sweepTimer = setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of entries) {
		const rule = matchRule(key);
		if (!rule || now - entry.storedAt >= rule.ttl + rule.swr) entries.delete(key);
	}
}, SWEEP_INTERVAL_MS);
if (sweepTimer.unref) sweepTimer.unref();
