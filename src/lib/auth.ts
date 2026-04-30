/**
 * Auth token storage helpers.
 *
 * The JWT issued by the backend's /auth/kakao/callback is stored in
 * localStorage under TOKEN_KEY. It travels back to the API on every
 * authenticated request as ``Authorization: Bearer <token>``.
 *
 * localStorage is fine for an MVP — we'll move to httpOnly cookies once we
 * harden against XSS for production.
 */
const TOKEN_KEY = "zami_jwt";

export function saveToken(token: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  // Wipe the in-browser API cache too — cached saju/match data is
  // namespaced by token, so leaving it around would expose the previous
  // user's data the next time someone signs in on the same device.
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