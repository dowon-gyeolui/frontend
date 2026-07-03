// API 베이스 URL 및 토스페이먼츠 클라이언트 키 설정.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";

export function isTossConfigured(): boolean {
  return /^(test|live)_g?ck_/.test(TOSS_CLIENT_KEY.trim());
}