"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

import type { MatchCandidate } from "@/components/matching/match-card";
import { deriveMatchKeywords, matchModalTip } from "@/lib/match-keywords";

const PLACEHOLDER_PHOTO =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop";

/**
 * 매칭 정보 확인 modal — Figma node 37:1175 (popup over /matching list).
 *
 * Glass card 341×543 with hero photo, hashtag chips, age/MBTI rows, a tip
 * line, and two CTA buttons (상세 정보 확인 / 채팅). The hashtags + tip are
 * derived client-side from the MatchCandidate's score/MBTI/element so the
 * modal stays useful even before any per-pair LLM call has run.
 */
export function MatchInfoModal({
  candidate,
  onClose,
  onOpenDetail,
  onStartChat,
}: {
  candidate: MatchCandidate;
  onClose: () => void;
  onOpenDetail: () => void;
  onStartChat: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const photo = candidate.photo_url ?? PLACEHOLDER_PHOTO;
  const name = candidate.nickname ?? "익명";
  const ageLabel = candidate.age !== null ? `${candidate.age}세` : "—";
  const mbtiLabel = candidate.mbti ?? "—";
  const keywords = deriveMatchKeywords(candidate);
  const tip = matchModalTip(candidate);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(27,16,41,0.4)] backdrop-blur-[2px] p-[20px]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-[341px] max-w-full rounded-[18px] border border-white/20 bg-white/70 p-[16px] backdrop-blur-[25px] shadow-[0_10px_40px_rgba(0,0,0,0.3)]"
      >
        {/* Close X */}
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-[12px] top-[12px] grid size-[24px] place-items-center"
        >
          <X className="size-[20px] stroke-[#1b1029] stroke-[2]" />
        </button>

        {/* Hero photo with name overlay */}
        <div className="relative mt-[20px] aspect-[279/320] w-full overflow-hidden rounded-[14px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo} alt={name} className="size-full object-cover" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#1a1225]/85" />
          <p className="absolute bottom-[14px] right-[16px] text-[24px] font-semibold tracking-tight text-white">
            {name}
          </p>
          {/* Score badge on photo */}
          <div className="absolute left-[14px] top-[14px] rounded-full bg-purple-500/95 px-[10px] py-[3px] text-[12px] font-bold text-white shadow-[0_0_10px_-2px_rgba(168,85,247,0.8)]">
            궁합 {candidate.score}%
          </div>
        </div>

        {/* Hashtags */}
        <div className="mt-[14px] flex flex-wrap items-center justify-center gap-x-[10px] gap-y-[4px]">
          {keywords.map((k) => (
            <span
              key={k}
              className="text-[16px] font-semibold tracking-[-0.3px] text-[#1b1029]"
            >
              {k}
            </span>
          ))}
        </div>

        {/* Age + MBTI */}
        <div className="mt-[10px] space-y-[2px] pl-[16px] text-[18px] font-medium leading-[28px] text-[#1b1029]">
          <p>나이 : {ageLabel}</p>
          <p>MBTI : {mbtiLabel}</p>
        </div>

        {/* Tip */}
        <p className="mt-[12px] text-center text-[13px] leading-[20px] text-[#1b1029]">
          {tip}
        </p>

        {/* CTAs */}
        <div className="mt-[14px] grid grid-cols-2 gap-[10px]">
          <button
            type="button"
            onClick={onOpenDetail}
            className="grid h-[34px] place-items-center rounded-[18px] text-[15px] font-semibold text-white shadow-[0_0_5px_2px_#7f55b4]"
            style={{
              backgroundImage:
                "linear-gradient(97deg, rgb(124, 58, 237) 0%, rgb(168, 85, 247) 100%)",
            }}
          >
            상세 정보 확인
          </button>
          <button
            type="button"
            onClick={onStartChat}
            className="grid h-[34px] place-items-center rounded-[18px] text-[15px] font-semibold text-white shadow-[0_0_5px_2px_#7f55b4]"
            style={{
              backgroundImage:
                "linear-gradient(97deg, rgb(124, 58, 237) 0%, rgb(168, 85, 247) 100%)",
            }}
          >
            채팅
          </button>
        </div>
      </div>
    </div>
  );
}