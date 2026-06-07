import { API_URL } from "@/lib/config";
import { getToken } from "@/lib/auth";

/**
 * Error thrown by {@link apiFetch} on a non-2xx response. Carries the HTTP
 * `status` so callers can branch on it — e.g. 402(스타 부족) → /store 유도,
 * 403(채팅 권한 없음), 404(후보 없음). `message` is the backend's Korean
 * `detail` when present, so it can be rendered directly in toast / error UI.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Thin fetch wrapper that prepends the API base URL and attaches the JWT
 * to every request. Throws {@link ApiError} on non-2xx so callers can rely
 * on a parsed body and branch on the status code.
 */
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
    // FastAPI raises HTTPException with `{ "detail": "사용자용 메시지" }`.
    // Surface that detail directly so toast / error UI can render the
    // Korean copy instead of "API 400: {"detail":"..."}".
    let message: string | null = null;
    try {
      const parsed = JSON.parse(body) as { detail?: unknown };
      if (typeof parsed.detail === "string") message = parsed.detail;
    } catch {
      /* not JSON — fall through */
    }
    throw new ApiError(resp.status, message ?? `API ${resp.status}: ${body}`);
  }
  if (resp.status === 204) return undefined as T;
  return resp.json() as Promise<T>;
}