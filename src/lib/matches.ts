/**
 * 인연 카드 열람 API 클라이언트 (PRD 카드 모델).
 *
 *   - GET  /matches/today  : 오늘의 인연 1장(무료, 자동 배정). 후보 없으면 null.
 *   - POST /matches/unlock : 추가 인연 유료 열람. 별 10개 차감, 하루 10장 한도.
 *   - GET  /matches        : 열람한 카드 목록 = 채팅 가능한 상대들.
 *
 * 열람 실패 코드: 402(스타 부족) / 403(하루 한도 초과) / 404(후보 없음).
 * 호출부는 ApiError.status 로 분기해 안내한다.
 */

import { apiFetch } from "@/lib/api";
import type { MatchCandidate } from "@/components/matching/match-card";

export type { MatchCandidate };

/** GET /matches/today */
export type TodayCardResponse = { card: MatchCandidate | null };

/** POST /matches/unlock */
export type UnlockResponse = {
  card: MatchCandidate;
  star_balance: number; // 차감 후 잔액
  extra_unlocked_today: number; // 오늘 추가 열람 장수 (한도 10)
};

/** 일일 추가 열람 한도 (PRD 6.3). */
export const EXTRA_DAILY_LIMIT = 10;

/** 인연 카드 1장 열람 비용(스타). 백엔드 STAR_COST_PER_CARD 와 동일. */
export const STAR_COST_PER_CARD = 10;

/** 오늘의 인연 1장(무료). 후보 풀이 없으면 card=null. */
export async function getTodayCard(): Promise<TodayCardResponse> {
  return apiFetch<TodayCardResponse>("/matches/today");
}

/** 추가 인연 유료 열람 — 별 10개 차감 후 다음 후보 공개. */
export async function unlockExtraCard(): Promise<UnlockResponse> {
  return apiFetch<UnlockResponse>("/matches/unlock", { method: "POST" });
}

/** 열람한 카드 목록(최근순) — 채팅 가능한 상대들. */
export async function listUnlocked(): Promise<MatchCandidate[]> {
  return apiFetch<MatchCandidate[]>("/matches");
}
