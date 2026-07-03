// API 요청 공통 래퍼 — JWT 첨부, 실패 응답을 ApiError 로 변환.
import { API_URL } from "@/lib/config";
import { getToken } from "@/lib/auth";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const resp = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!resp.ok) {
    const body = await resp.text();
    let message: string | null = null;
    try {
      const parsed = JSON.parse(body) as { detail?: unknown };
      if (typeof parsed.detail === "string") message = parsed.detail;
    } catch {}
    throw new ApiError(resp.status, message ?? `API ${resp.status}: ${body}`);
  }
  if (resp.status === 204) return undefined as T;
  return resp.json() as Promise<T>;
}