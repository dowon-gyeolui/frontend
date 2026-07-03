// 인연 카드 열람 API 클라이언트 (오늘의 카드 / 추가 열람 / 열람 목록).
import { apiFetch } from "@/lib/api";
import type { MatchCandidate } from "@/components/matching/match-card";

export type { MatchCandidate };

export type TodayCardResponse = { card: MatchCandidate | null };

export type UnlockResponse = {
  card: MatchCandidate;
  star_balance: number;
  extra_unlocked_today: number;
};

export const EXTRA_DAILY_LIMIT = 10;

export const STAR_COST_PER_CARD = 10;

const USE_MOCK_PHOTOS = true;
const MOCK_PHOTOS = ["/cynthia.png"];

function withMockPhotos(card: MatchCandidate | null): MatchCandidate | null {
  if (!USE_MOCK_PHOTOS || !card) return card;
  return { ...card, photos: MOCK_PHOTOS, is_blinded: false };
}

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

export async function getTodayCard(): Promise<TodayCardResponse> {
  const res = await apiFetch<TodayCardResponse>("/matches/today");
  const card = withMockPhotos(res.card);
  return { card: card ?? (USE_MOCK_PHOTOS ? mockCard() : null) };
}

export async function unlockExtraCard(): Promise<UnlockResponse> {
  const res = await apiFetch<UnlockResponse>("/matches/unlock", { method: "POST" });
  const card = withMockPhotos(res.card);
  return card ? { ...res, card } : res;
}

export async function listUnlocked(): Promise<MatchCandidate[]> {
  return apiFetch<MatchCandidate[]>("/matches");
}