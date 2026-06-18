"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

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
 * 궁합 점수를 구간 라벨로 변환. 정확한 숫자 대신 "N점 이상"만 노출한다.
 * 70점 미만은 배지를 달지 않는다(null).
 */
export function scoreTierLabel(score: number): string | null {
  if (score >= 90) return "90점 이상";
  if (score >= 80) return "80점 이상";
  if (score >= 70) return "70점 이상";
  return null;
}

/**
 * 오늘의 인연 카드 — 큰 사진(세로 4:5) 위에 이름을 얹고, 아래 정보 영역에
 * 나이·MBTI·한줄소개를 노출한다. 궁합 점수는 노출하지 않는다. 카드 폭은
 * 부모 컨테이너가 결정(홈에서는 화면 폭 전체)하고, 내부 요소는 그 폭에
 * 맞춰 확장된다.
 *
 * 무료/블라인드 정책: free 사용자는 블라인드 사진(블러 + "열람 후 공개").
 */
export function MatchCard({
  data,
  showScoreTier = false,
}: {
  data: MatchCandidate;
  /** "너와의 인연"(유료 열람) 카드에만 궁합 점수 구간 배지를 노출 */
  showScoreTier?: boolean;
}) {
  const photos =
    data.photos && data.photos.length > 0
      ? data.photos
      : [data.photo_url ?? PLACEHOLDER_PHOTO];
  const name = data.nickname ?? "익명";
  const ageLabel = data.age !== null ? `${data.age}세` : "—";
  const tier = showScoreTier ? scoreTierLabel(data.score) : null;

  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(index, photos.length - 1);
  // 블라인드(미열람) 카드는 사진을 넘기지 못하게 한다.
  const multiple = photos.length > 1 && !data.is_blinded;
  const go = (dir: number) =>
    setIndex((i) => (i + dir + photos.length) % photos.length);
  const touchX = useRef<number | null>(null);

  return (
    <article className="overflow-hidden rounded-[22px] border border-white/15 bg-white/10 shadow-[0px_10px_24px_0px_rgba(0,0,0,0.3),0px_0px_36px_0px_rgba(168,85,247,0.18)] backdrop-blur-sm">
      {/* Photo — 큰 세로 사진 캐러셀. Free 사용자는 블러 + 안내 pill. */}
      <div
        className="relative aspect-[4/5] w-full overflow-hidden"
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (multiple && Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[safeIndex]}
          alt={`${name} ${safeIndex + 1}`}
          className={`size-full object-cover ${data.is_blinded ? "blur-[16px] scale-110" : ""}`}
        />
        {/* Bottom fade so the name remains legible over any photo */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#1a1225]/85" />

        {/* 사진 번호 (n/N) — 상단 중앙 */}
        {multiple && (
          <div className="absolute left-1/2 top-[12px] -translate-x-1/2 rounded-full bg-black/55 px-[10px] py-[3px] text-[12px] font-semibold text-white backdrop-blur-sm">
            {safeIndex + 1} / {photos.length}
          </div>
        )}

        {/* 좌우 넘기기 화살표 — 카드는 보통 클릭 시 모달을 여는 button 안에
            들어가므로, span+stopPropagation 으로 사진 넘김과 모달 열림을 분리한다. */}
        {multiple && (
          <>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              aria-label="이전 사진"
              className="absolute left-[8px] top-1/2 grid size-[32px] -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-black/40 backdrop-blur-sm active:scale-95"
            >
              <ChevronLeft className="size-[20px] stroke-white stroke-[2.5]" />
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              aria-label="다음 사진"
              className="absolute right-[8px] top-1/2 grid size-[32px] -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-black/40 backdrop-blur-sm active:scale-95"
            >
              <ChevronRight className="size-[20px] stroke-white stroke-[2.5]" />
            </span>
          </>
        )}

        {/* ZAMI 공식 얼굴 인증 뱃지 */}
        {data.is_face_verified && !data.is_blinded && (
          <div className="absolute right-[12px] top-[12px]">
            <ZamiVerifiedBadge size="sm" />
          </div>
        )}

        {/* 궁합 점수 구간 배지 — "너와의 인연" 카드 전용 */}
        {tier && (
          <div className="absolute left-[12px] top-[12px] rounded-full bg-purple-500/95 px-[10px] py-[3px] text-[12px] font-bold text-white shadow-[0_0_10px_-2px_rgba(168,85,247,0.8)]">
            궁합 {tier}
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