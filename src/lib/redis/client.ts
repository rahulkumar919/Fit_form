/**
 * Redis client — supports Upstash REST API (serverless-safe) or ioredis.
 * Falls back gracefully when not configured (returns null for all gets).
 *
 * Usage:
 *   import { cache } from "@/lib/redis/client";
 *   const data = await cache.get("key");
 *   await cache.set("key", JSON.stringify(value), 300); // 300s TTL
 *   await cache.del("key");
 */

import { Redis as UpstashRedis } from "@upstash/redis";

/* TTL constants (seconds) */
export const TTL = {
  PRODUCTS: 300,       // 5 min — invalidate on product mutation
  COMBOS: 300,
  CATEGORIES: 600,     // 10 min
  HOMEPAGE: 180,       // 3 min
  CART: 3600,          // 1 hr
  SESSION: 86400,      // 24 hr
} as const;

/** Minimal cache interface so we can swap implementations. */
export interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(...keys: string[]): Promise<void>;
  flush(): Promise<void>;
}

/** No-op cache used when Redis is not configured. */
const noopCache: CacheClient = {
  get: async () => null,
  set: async () => undefined,
  del: async () => undefined,
  flush: async () => undefined,
};

/** Real Upstash credentials only: placeholders like "your-…" must not make every request wait on a dead host. */
export function upstashConfigured(): boolean {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim() ?? "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ?? "";
  if (!url || !token || /your|xxx|example|placeholder|changeme/i.test(url + token)) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && token.length >= 20;
  } catch {
    return false;
  }
}

/** Cache calls are best-effort: never let a slow Redis hold up a page for more than this. */
const CACHE_TIMEOUT_MS = 800;
function withTimeout<T>(p: Promise<T>, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const t = setTimeout(() => resolve(fallback), CACHE_TIMEOUT_MS);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      () => { clearTimeout(t); resolve(fallback); },
    );
  });
}

function buildUpstashCache(): CacheClient {
  const upstash = new UpstashRedis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  return {
    async get(key) {
      try {
        const raw = await withTimeout(upstash.get<string>(key), null);
        if (raw == null) return null;
        // Upstash auto-parses JSON values; callers expect the original string.
        return typeof raw === "string" ? raw : JSON.stringify(raw);
      } catch {
        return null;
      }
    },
    async set(key, value, ttl) {
      try {
        await withTimeout(ttl ? upstash.setex(key, ttl, value) : upstash.set(key, value), null);
      } catch {
        /* silent — cache miss is always safe */
      }
    },
    async del(...keys) {
      try {
        if (keys.length) await withTimeout(upstash.del(...keys), 0);
      } catch { /* silent */ }
    },
    async flush() {
      try {
        await withTimeout(upstash.flushall(), null);
      } catch { /* silent */ }
    },
  };
}

/** Lazy singleton — initialised once on first import. */
let _cache: CacheClient | null = null;

function getCache(): CacheClient {
  if (_cache) return _cache;

  if (upstashConfigured()) {
    _cache = buildUpstashCache();
    return _cache;
  }

  // No Redis configured — use noop
  _cache = noopCache;
  return _cache;
}

export const cache: CacheClient = {
  get: (k) => getCache().get(k),
  set: (k, v, t) => getCache().set(k, v, t),
  del: (...k) => getCache().del(...k),
  flush: () => getCache().flush(),
};

/* ── Cache key helpers ───────────────────────────────────────── */
export const CacheKey = {
  products: (slug?: string) => slug ? `products:${slug}` : "products:all",
  productsByCategory: (cat: string) => `products:cat:${cat}`,
  combos: (slug?: string) => slug ? `combos:${slug}` : "combos:all",
  categories: () => "categories:all",
  homepage: () => "homepage:data",
  coupon: (code: string) => `coupons:${code.toUpperCase()}`,
  dashboardKpis: () => "admin:kpis",
};
