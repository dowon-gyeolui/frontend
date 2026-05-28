"use client";

import { ZamiVerifiedBadge } from "@/components/brand/zami-verified-badge";
import { matchCardComment } from "@/lib/match-keywords";

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
  birth_year: number | null;
  dominant_element: string | null;
  mbti: string | null;
  /** ZAMI strict 얼굴 인증을 통과한 사진을 메인으로 가진 사용자 */
  is_face_verified?: boolean;
};

const PLACEHOLDER_PHOTO =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&blur=20";

const ELEMENT_HANJA: Record<string, string> = {
  목: "木",
  화: "火",
  토: "土",
  금: "金",
  수: "水",
};

/**
 * Card layout faithful to Figma component 25:278 (150×245). Every element
 * is positioned with **% inset** so the whole card scales uniformly with
 * its container width — when the parent grid gives it 145px on mobile or
 * 175px on desktop, photo / name / stats / comment all stay in proportion.
 *
 * The fixed text sizes (12px / 10px) deliberately do *not* scale — text
 * legibility wins over pixel-perfect proportion at the small sizes the
 * card targets.
 */
export function MatchCard({ data }: { data: MatchCandidate }) {
  const photo = data.photo_url ?? PLACEHOLDER_PHOTO;
  const name = data.nickname ?? "익명";
  const ageLabel = data.age !== null ? `${data.age}세` : "—";
  const elementLabel = data.dominant_element
    ? `${data.dominant_element}(${ELEMENT_HANJA[data.dominant_element] ?? "?"})`
    : "?";

  return (
    <article className="relative aspect-[150/245] overflow-hidden rounded-[18px] border border-white/15 bg-white/10 shadow-[0px_10px_20px_0px_rgba(0,0,0,0.3),0px_0px_30px_0px_rgba(168,85,247,0.15)] backdrop-blur-sm">
      {/* Photo — Figma inset: x 6.67%, y starts at ~3.27%, aspect 130/149.
          Free users see a heavily-blurred teaser; paying for chat removes
          the blur on next render. */}
      <div className="absolute inset-x-[6.67%] top-[3.27%] aspect-[130/149] overflow-hidden rounded-[14px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt={name}
          className={`size-full object-cover ${data.is_blinded ? "blur-[14px] scale-110" : ""}`}
        />
        {/* Bottom fade so the name remains legible over any photo */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#1a1225]/80" />
        {data.is_blinded && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="rounded-full bg-black/55 px-[8px] py-[2px] text-[9px] font-medium text-white/85 backdrop-blur-sm">
              결제 후 공개
            </span>
          </div>
        )}
      </div>

      {/* Score badge — top-left over the photo */}
      <div className="absolute left-[6%] top-[3%] rounded-full bg-purple-500/95 px-[8px] py-[2px] text-[11px] font-bold text-white shadow-[0_0_10px_-2px_rgba(168,85,247,0.8)]">
        {data.score}%
      </div>

      {/* ZAMI 공식 얼굴 인증 뱃지 — 사진이 strict face check 를 통과한
          사용자에게만 노출. 매칭 카드 내에서 사진 우상단에 작은
          원형 뱃지로 신뢰도 시그널을 줌. */}
      {data.is_face_verified && !data.is_blinded && (
        <div className="absolute right-[6%] top-[3%]">
          <ZamiVerifiedBadge size="sm" />
        </div>
      )}

      {/* Name — Figma inset-[53.88% 12% 36.33% 64%] (over photo, bottom-right) */}
      <p className="absolute right-[10%] top-[53%] text-[14px] font-medium tracking-tight text-white">
        {name}
      </p>

      {/* Stats — Figma inset-[66.12% 42.67% 15.92% 8%] */}
      <div className="absolute inset-x-[8%] top-[68%] text-[12px] leading-[18px] text-white/85">
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-white/55">나이</span>
          <span className="font-medium">{ageLabel}</span>
        </div>
        <div className="mt-[1px] flex items-baseline justify-between gap-1">
          <span className="text-white/55">오행</span>
          <span className="truncate font-medium">{elementLabel}</span>
        </div>
      </div>

      {/* Comment — Figma inset-[86.12% 16% 4.08% 16.67%].
          Per-user tagline is seeded by user_id so each card shows a
          different short caption instead of the same 5 strings. */}
      <p className="absolute inset-x-[10%] bottom-[5%] line-clamp-2 text-center text-[10px] leading-[14px] text-white/75">
        {matchCardComment(data)}
      </p>
    </article>
  );
}