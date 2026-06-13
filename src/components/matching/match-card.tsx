"use client";

import { ZamiVerifiedBadge } from "@/components/brand/zami-verified-badge";

/**
 * Match candidate shape returned by `GET /compatibility/matches`. Mirrors the
 * backend's MatchCandidate pydantic schema. `photo_url` is omitted when the
 * caller is on the free tier (is_blinded=true), so the UI must handle null.
 */
export type MatchCandidate = {
  user_id: number;
  score: number;
  nickname: string | null;
  age: number | null;
  gender: string | null;
  is_blinded: boolean;
  photo_url: string | null;
  /** 후보가 등록한 전체 사진 URL (position 순) — 팝업 캐러셀용 */
  photos?: string[];
  /** 한줄 자기소개 */
  bio?: string | null;
  birth_year: number | null;
  dominant_element: string | null;
  mbti: string | null;
  /** ZAMI strict 얼굴 인증을 통과한 사진을 메인으로 가진 사용자 */
  is_face_verified?: boolean;
};

const PLACEHOLDER_PHOTO =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&blur=20";

/**
 * 오늘의 인연 카드 — 큰 사진(세로 4:5) 위에 이름을 얹고, 아래 정보 영역에
 * 나이·MBTI·한줄소개를 노출한다. 궁합 점수는 노출하지 않는다. 카드 폭은
 * 부모 컨테이너가 결정(홈에서는 화면 폭 전체)하고, 내부 요소는 그 폭에
 * 맞춰 확장된다.
 *
 * 무료/블라인드 정책: free 사용자는 블라인드 사진(블러 + "열람 후 공개").
 */
export function MatchCard({ data }: { data: MatchCandidate }) {
  const photo = data.photo_url ?? PLACEHOLDER_PHOTO;
  const name = data.nickname ?? "익명";
  const ageLabel = data.age !== null ? `${data.age}세` : "—";

  return (
    <article className="overflow-hidden rounded-[22px] border border-white/15 bg-white/10 shadow-[0px_10px_24px_0px_rgba(0,0,0,0.3),0px_0px_36px_0px_rgba(168,85,247,0.18)] backdrop-blur-sm">
      {/* Photo — 큰 세로 사진. Free 사용자는 블러 + 안내 pill. */}
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt={name}
          className={`size-full object-cover ${data.is_blinded ? "blur-[16px] scale-110" : ""}`}
        />
        {/* Bottom fade so the name remains legible over any photo */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#1a1225]/85" />

        {/* ZAMI 공식 얼굴 인증 뱃지 */}
        {data.is_face_verified && !data.is_blinded && (
          <div className="absolute right-[12px] top-[12px]">
            <ZamiVerifiedBadge size="sm" />
          </div>
        )}

        {data.is_blinded && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="rounded-full bg-black/55 px-[12px] py-[4px] text-[12px] font-medium text-white/90 backdrop-blur-sm">
              열람 후 공개
            </span>
          </div>
        )}

        {/* Name overlay (bottom-left) */}
        <p className="absolute bottom-[14px] left-[16px] text-[24px] font-bold tracking-tight text-white drop-shadow">
          {name}
        </p>
      </div>

      {/* Info — 나이 · MBTI · 한줄소개 */}
      <div className="flex flex-col gap-[8px] px-[16px] py-[14px]">
        <div className="flex items-center gap-[8px] text-[15px] text-white">
          <span className="font-semibold">{ageLabel}</span>
          {data.mbti && (
            <>
              <span className="text-white/30">·</span>
              <span className="rounded-full bg-white/15 px-[8px] py-[2px] text-[13px] font-medium text-white/90">
                {data.mbti}
              </span>
            </>
          )}
        </div>
        {data.bio && (
          <p className="line-clamp-2 text-[13px] leading-[19px] text-white/70">
            {data.bio}
          </p>
        )}
      </div>
    </article>
  );
}