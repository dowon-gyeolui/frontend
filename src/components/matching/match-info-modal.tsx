"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { InterviewViewModal } from "@/components/matching/interview-view-modal";
import { scoreTierLabel, type MatchCandidate } from "@/components/matching/match-card";
import { PhotoCarousel } from "@/components/matching/photo-carousel";

const PLACEHOLDER_PHOTO =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop";

/**
 * 매칭 정보 확인 modal — hero 사진 캐러셀(좌우 화살표 + n/N 번호),
 * 이름/나이/MBTI/한줄소개, 두 개의 CTA(상세 정보 확인 / 채팅).
 *
 * 사진은 후보가 등록한 전체 사진(candidate.photos)을 좌우로 넘겨본다.
 * photos 가 비어 있으면 photo_url(대표 사진) 한 장으로 폴백한다.
 * 궁합 점수는 노출하지 않는다.
 */
export function MatchInfoModal({
  candidate,
  onClose,
  onOpenDetail,
  onStartChat,
  showScoreTier = false,
}: {
  candidate: MatchCandidate;
  onClose: () => void;
  onOpenDetail: () => void;
  onStartChat: () => void;
  /** "너와의 인연"(유료 열람) 카드에만 궁합 점수 구간 배지를 노출 */
  showScoreTier?: boolean;
}) {
  const photos =
    candidate.photos && candidate.photos.length > 0
      ? candidate.photos
      : [candidate.photo_url ?? PLACEHOLDER_PHOTO];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const name = candidate.nickname ?? "익명";
  const ageLabel = candidate.age !== null ? `${candidate.age}세` : "—";
  const tier = showScoreTier ? scoreTierLabel(candidate.score) : null;

  // "나를 보여주는 연애 프로필 질문" — 내 인터뷰 작성/수정 모달.
  const [interviewOpen, setInterviewOpen] = useState(false);

  return (
    <>
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
          className="absolute right-[12px] top-[12px] z-10 grid size-[24px] place-items-center"
        >
          <X className="size-[20px] stroke-[#1b1029] stroke-[2]" />
        </button>

        {/* Hero photo carousel(드래그 스와이프 + 하단 점). 미열람(블라인드)
            상태면 블러 + 안내 pill. */}
        <PhotoCarousel
          photos={photos}
          alt={name}
          enabled={!candidate.is_blinded}
          className="mt-[20px] aspect-[279/320] w-full overflow-hidden rounded-[14px]"
          imageClassName={`size-full object-cover ${candidate.is_blinded ? "blur-[18px] scale-110" : ""}`}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#1a1225]/85" />
          <p className="absolute bottom-[14px] right-[16px] text-[24px] font-semibold tracking-tight text-white">
            {name}
          </p>

          {candidate.is_blinded && (
            <div className="pointer-events-none absolute inset-x-0 top-1/2 grid -translate-y-1/2 place-items-center">
              <div className="flex items-center gap-[6px] rounded-full bg-black/60 px-[12px] py-[5px] text-[12px] font-medium text-white/95 backdrop-blur-sm">
                카드 열람 후 사진 공개
              </div>
            </div>
          )}
        </PhotoCarousel>

        {/* 한줄소개 (나이·MBTI·궁합은 추후 노출 — 지금은 자기소개만) */}
        <div className="mt-[12px] space-y-[6px] pl-[16px] pr-[8px] text-[#1b1029]">
          {/* 추후 노출 예정 — 임시 숨김. 복구하려면 아래 주석을 푸세요.
          {tier && (
            <span className="inline-block rounded-full bg-purple-500/15 px-[10px] py-[3px] text-[13px] font-bold text-purple-700">
              궁합 {tier}
            </span>
          )}
          <div className="flex items-center gap-[8px] text-[18px] font-medium leading-[26px]">
            <span>나이 : {ageLabel}</span>
            {candidate.mbti && (
              <>
                <span className="text-black/30">·</span>
                <span className="rounded-full bg-[#1b1029]/10 px-[8px] py-[2px] text-[14px] font-semibold">
                  {candidate.mbti}
                </span>
              </>
            )}
          </div>
          */}
          {candidate.bio && (
            <p className="text-[14px] leading-[20px] text-[#1b1029]/70">
              {candidate.bio}
            </p>
          )}
        </div>

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

        {/* 상대의 연애 프로필 질문 답변 보기 (읽기 전용) */}
        <button
          type="button"
          onClick={() => setInterviewOpen(true)}
          className="mt-[10px] grid h-[40px] w-full place-items-center rounded-[18px] border border-[#7c3aed]/40 bg-[#7c3aed]/10 text-[14px] font-semibold text-purple-700 hover:bg-[#7c3aed]/20"
        >
          연애 프로필 질문 보기
        </button>
      </div>
    </div>

    {interviewOpen && (
      <InterviewViewModal
        peerId={candidate.user_id}
        name={name}
        onClose={() => setInterviewOpen(false)}
      />
    )}
    </>
  );
}
