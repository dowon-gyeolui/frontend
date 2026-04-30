/**
 * Tiny localStorage cache for read-mostly API responses.
 *
 * Why: /saju/me, /saju/me/detailed, /jamidusu/me, and /compatibility/matches
 * are all relatively expensive (saju math + LLM call) but rarely change
 * for a given user. Without caching, every navigation back to /home or
 * /saju re-blocks on a 5–10s LLM round-trip and the user sees a spinner
 * even though they already saw the answer 30 seconds ago. The cache lets
 * those screens render instantly on revisit and silently revalidate in
 * the background.
 *
 * Scope: keyed per-token so different users on the same device don't
 * leak cached data. Bumping CACHE_VERSION invalidates everything if a
 * payload shape changes.
 */

import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

const CACHE_VERSION = "v1";

/** TTLs (ms). Keep short for collection endpoints, long for own-profile. */
export const CACHE_TTL = {
  saju: 24 * 60 * 60 * 1000, // /saju/me, /saju/me/detailed, /jamidusu/me
  matches: 60 * 60 * 1000, // /compatibility/matches — refreshed hourly
  short: 5 * 60 * 1000, // misc
} as const;

function tokenSuffix(): string {
  const t = getToken();
  if (!t) return "anon";
  // Stable short hash. Just enough to namespace per-session — not
  // security-relevant since localStorage is already same-origin.
  let h = 0;
  for (let i = 0; i < t.length; i += 1) {
    h = ((h << 5) - h + t.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

function makeKey(path: string): string {
  return `zami:${CACHE_VERSION}:${tokenSuffix()}:${path}`;
}

/** Read a cached value if it's still within `ttlMs`. */
export function cacheGet<T>(path: string, ttlMs: number): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(makeKey(path));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v: T; t: number };
    if (Date.now() - parsed.t > ttlMs) return null;
    return parsed.v;
  } catch {
    return null;
  }
}

export function cacheSet<T>(path: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      makeKey(path),
      JSON.stringify({ v: value, t: Date.now() }),
    );
  } catch {
    // Quota exceeded / private mode — silently drop. The next call
    // will just refetch.
  }
}

export function cacheRemove(path: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(makeKey(path));
  } catch {
    /* noop */
  }
}

/** Wipe every zami: prefixed cache entry — call this on logout. */
export function cacheClearAll(): void {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith("zami:")) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* noop */
  }
}

/**
 * Stale-while-revalidate fetch.
 *
 * 1. Synchronously calls `setter` with cached data if available — this
 *    is what makes the second visit feel instant.
 * 2. Always fires a network request; on success calls `setter` again
 *    with fresh data and updates the cache.
 * 3. If the network fails BUT we have no cache, calls `onError`. If we
 *    do have cache, the failure is swallowed — user keeps seeing the
 *    stale-but-valid copy.
 */
export async function fetchWithCache<T>(
  path: string,
  ttlMs: number,
  setter: (v: T) => void,
  options: { onError?: (e: Error) => void } = {},
): Promise<void> {
  const cached = cacheGet<T>(path, ttlMs);
  if (cached !== null) setter(cached);

  try {
    const fresh = await apiFetch<T>(path);
    setter(fresh);
    cacheSet(path, fresh);
  } catch (e) {
    if (cached === null) {
      const err = e instanceof Error ? e : new Error(String(e));
      options.onError?.(err);
    }
  }
}