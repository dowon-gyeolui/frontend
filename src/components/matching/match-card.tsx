"use client";
// 홈/매칭 화면의 인연 카드 — 사진 캐러셀 + 이름/나이/MBTI/한줄소개.

import { PhotoCarousel } from "@/components/matching/photo-carousel";
import { ZamiVerifiedBadge } from "@/components/brand/zami-verified-badge";

export type MatchCandidate = {
  user_id: number;
  score: number;
  nickname: string | null;
  age: number | null;
  gender: string | null;
  is_blinded: boolean;
  photo_url: string | null;
  photos?: string[];
  bio?: string | null;
  birth_year: number | null;
  dominant_element: string | null;
  mbti: string | null;
  is_face_verified?: boolean;
};

const PLACEHOLDER_PHOTO =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&blur=20";

export function scoreTierLabel(score: number): string | null {
  if (score >= 90) return "90점 이상";
  if (score >= 80) return "80점 이상";
  if (score >= 70) return "70점 이상";
  return null;
}

export function MatchCard({
  data,
  showScoreTier = false,
}: {
  data: MatchCandidate;
  showScoreTier?: boolean;
}) {
  const photos =
    data.photos && data.photos.length > 0
      ? data.photos
      : [data.photo_url ?? PLACEHOLDER_PHOTO];
  const name = data.nickname ?? "익명";
  const ageLabel = data.age !== null ? `${data.age}세` : "—";
  const tier = showScoreTier ? scoreTierLabel(data.score) : null;

  return (
    <article className="overflow-hidden rounded-[22px] border border-white/15 bg-white/10 shadow-[0px_10px_24px_0px_rgba(0,0,0,0.3),0px_0px_36px_0px_rgba(168,85,247,0.18)] backdrop-blur-sm">
      <PhotoCarousel
        photos={photos}
        alt={name}
        enabled={!data.is_blinded}
        className="aspect-[4/5] w-full overflow-hidden"
        imageClassName={`size-full object-cover ${data.is_blinded ? "blur-[16px] scale-110" : ""}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#1a1225]/85" />

        {data.is_face_verified && !data.is_blinded && (
          <div className="absolute right-[12px] top-[12px]">
            <ZamiVerifiedBadge size="sm" />
          </div>
        )}

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

        <p className="absolute bottom-[14px] left-[16px] text-[24px] font-bold tracking-tight text-white drop-shadow">
          {name}
        </p>
      </PhotoCarousel>

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