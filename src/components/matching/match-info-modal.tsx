"use client";
// 매칭 정보 확인 모달 — hero 사진 캐러셀 + 이름/한줄소개 + 상세보기/채팅 CTA.

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { InterviewViewModal } from "@/components/matching/interview-view-modal";
import { type MatchCandidate } from "@/components/matching/match-card";
import { PhotoCarousel } from "@/components/matching/photo-carousel";

const PLACEHOLDER_PHOTO =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop";

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
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-[12px] top-[12px] z-10 grid size-[24px] place-items-center"
        >
          <X className="size-[20px] stroke-[#1b1029] stroke-[2]" />
        </button>

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

        <div className="mt-[12px] space-y-[6px] pl-[16px] pr-[8px] text-[#1b1029]">
          {candidate.bio && (
            <p className="text-[14px] leading-[20px] text-[#1b1029]/70">
              {candidate.bio}
            </p>
          )}
        </div>

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