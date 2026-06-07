export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * 토스페이먼츠 클라이언트 키(공개키). `.env` 의 NEXT_PUBLIC_TOSS_CLIENT_KEY.
 * 비어 있으면 결제창을 띄울 수 없으므로 /store 가 안내 문구를 노출한다
 * (isTossConfigured 로 판별).
 */
export const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";

/** 토스 키가 실제로 설정됐는지(빈 값/placeholder 가 아닌지). */
export function isTossConfigured(): boolean {
  return /^(test|live)_g?ck_/.test(TOSS_CLIENT_KEY.trim());
}
