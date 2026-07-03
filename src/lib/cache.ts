// 읽기 위주 API 응답을 위한 localStorage 캐시(토큰별 네임스페이스, stale-while-revalidate).
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

const CACHE_VERSION = "v1";

export const CACHE_TTL = {
  saju: 24 * 60 * 60 * 1000,
  matches: 60 * 60 * 1000,
  short: 5 * 60 * 1000,
} as const;

function tokenSuffix(): string {
  const t = getToken();
  if (!t) return "anon";
  let h = 0;
  for (let i = 0; i < t.length; i += 1) {
    h = ((h << 5) - h + t.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

function makeKey(path: string): string {
  return `zami:${CACHE_VERSION}:${tokenSuffix()}:${path}`;
}

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
  } catch {}
}

export function cacheClearAll(): void {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith("zami:")) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {}
}

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