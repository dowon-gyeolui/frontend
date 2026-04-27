"use client";

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
};

/**
 * Synthesise a short Korean tagline from a saju score. Used as the bottom
 * line of a match card. Once /compatibility/score returns a per-pair summary
 * we can swap this out for the real interpretation.
 */
export function scoreComment(score: number): string {
  if (score >= 90) return "운명적인 인연이에요!";
  if (score >= 80) return "사주 궁합이 매우 좋아요";
  if (score >= 70) return "서로를 잘 보완해줘요";
  if (score >= 60) return "함께라면 안정적이에요";
  return "특별한 인연일 수 있어요";
}

const PLACEHOLDER_PHOTO =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&blur=20";

export function MatchCard({ data }: { data: MatchCandidate }) {
  const photo = data.photo_url ?? PLACEHOLDER_PHOTO;
  const name = data.nickname ?? "익명";
  const ageLabel = data.age !== null ? `${data.age}세` : "—";
  const elementLabel = data.dominant_element
    ? `${data.dominant_element}(${data.dominant_element === "목" ? "木" : data.dominant_element === "화" ? "火" : data.dominant_element === "토" ? "土" : data.dominant_element === "금" ? "金" : "水"})`
    : "?";

  return (
    <article className="relative h-[245px] overflow-hidden rounded-[18px] border border-white/15 bg-white/10 shadow-[0px_10px_20px_0px_rgba(0,0,0,0.3),0px_0px_30px_0px_rgba(168,85,247,0.15)] backdrop-blur-sm">
      {/* Photo with bottom fade */}
      <div className="absolute inset-x-[10px] top-[8px] aspect-[130/149] overflow-hidden rounded-[14px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={name} className="size-full object-cover" />
        <div className="absolute inset-0 rounded-[14px] bg-gradient-to-b from-transparent via-transparent to-[#1a1225]/80" />
        <p className="absolute bottom-[6px] right-[10px] text-[14px] font-medium tracking-tight text-white">
          {name}
        </p>
        {/* Score badge top-left */}
        <div className="absolute left-[8px] top-[8px] rounded-full bg-purple-500/90 px-[8px] py-[2px] text-[11px] font-bold text-white shadow-[0_0_10px_-2px_rgba(168,85,247,0.8)]">
          {data.score}%
        </div>
      </div>
      {/* Stats */}
      <div className="absolute left-[12px] top-[162px] text-[14px] leading-[22px] text-white/80">
        <p>나이 : {ageLabel}</p>
        <p>오행 : {elementLabel}</p>
      </div>
      {/* Comment */}
      <p className="absolute bottom-[10px] left-1/2 w-[80%] -translate-x-1/2 whitespace-pre-line text-center text-[10px] text-white">
        {scoreComment(data.score)}
      </p>
    </article>
  );
}