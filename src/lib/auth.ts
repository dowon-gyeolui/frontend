// 인증 토큰(JWT) 저장/조회/삭제 헬퍼.
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
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith("zami:")) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {}
}