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

// ──────────────────────────────────────────────────────────────────────
// ⚠️ 테스트용 mock — 신시아 1명만 카드로 노출한다.
// true 면 백엔드가 돌려준 카드를 신시아 사진으로 덮어쓰고, 후보가 없으면
// 신시아 가짜 카드를 띄운다. 테스트가 끝나면 false 로 바꾸거나 이 블록을 지우세요.
const USE_MOCK_PHOTOS = true;
const MOCK_PHOTOS = ["/cynthia.png"];

function withMockPhotos(card: MatchCandidate | null): MatchCandidate | null {
  if (!USE_MOCK_PHOTOS || !card) return card;
  // 신시아 사진으로 덮어쓰고 블라인드 해제.
  return { ...card, photos: MOCK_PHOTOS, is_blinded: false };
}

// 후보가 없을 때도 카드를 확인할 수 있도록 만드는 신시아 가짜 카드.
function mockCard(): MatchCandidate {
  return {
    user_id: 999999,
    score: 92,
    nickname: "신시아",
    age: 30,
    gender: "female",
    is_blinded: false,
    photo_url: MOCK_PHOTOS[0],
    photos: MOCK_PHOTOS,
    bio: "잔잔한 대화와 여행을 좋아해요. 편하게 인사해요!",
    birth_year: 1995,
    dominant_element: "수",
    mbti: "INFJ",
    is_face_verified: true,
  };
}
// ──────────────────────────────────────────────────────────────────────

/** 오늘의 인연 1장(무료). 후보 풀이 없으면 card=null. */
export async function getTodayCard(): Promise<TodayCardResponse> {
  const res = await apiFetch<TodayCardResponse>("/matches/today");
  const card = withMockPhotos(res.card);
  // 테스트 모드 + 후보 없음이면 가짜 카드라도 띄워 스와이프를 확인.
  return { card: card ?? (USE_MOCK_PHOTOS ? mockCard() : null) };
}

/** 추가 인연 유료 열람 — 별 10개 차감 후 다음 후보 공개. */
export async function unlockExtraCard(): Promise<UnlockResponse> {
  const res = await apiFetch<UnlockResponse>("/matches/unlock", { method: "POST" });
  const card = withMockPhotos(res.card);
  return card ? { ...res, card } : res;
}

/** 열람한 카드 목록(최근순) — 채팅 가능한 상대들. */
export async function listUnlocked(): Promise<MatchCandidate[]> {
  return apiFetch<MatchCandidate[]>("/matches");
}
