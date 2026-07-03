"use client";
// 상대의 연애 인터뷰 답변을 읽기 전용으로 보여주는 모달 — 상호주의로 잠긴 개수도 표시.

import { Lock, X } from "lucide-react";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { INTERVIEW_QUESTION_MAP } from "@/lib/interview";

type InterviewView = {
  interview_answers: { question_key: string; answer: string }[];
  interview_total: number;
};

export function InterviewViewModal({
  peerId,
  name,
  onClose,
}: {
  peerId: number;
  name: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<InterviewView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<InterviewView>(`/users/${peerId}/public-profile`)
      .then((r) =>
        setData({
          interview_answers: r.interview_answers ?? [],
          interview_total: r.interview_total ?? 0,
        }),
      )
      .catch((e) =>
        setError(e instanceof Error ? e.message : "불러오지 못했어요."),
      );
  }, [peerId]);

  const locked = data
    ? data.interview_total - data.interview_answers.length
    : 0;

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-[20px] backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[85vh] w-[360px] max-w-full flex-col rounded-[18px] border border-white/15 bg-[#241338] shadow-[0_10px_40px_rgba(0,0,0,0.45)]"
      >
        <div className="relative px-[20px] pt-[18px]">
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="absolute right-[12px] top-[16px] grid size-[24px] place-items-center"
          >
            <X className="size-[20px] stroke-white stroke-[2]" />
          </button>
          <h3 className="text-center text-[17px] font-bold text-white">
            {name}님의 연애 프로필
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto px-[20px] py-[14px]">
          {error && (
            <p className="py-[20px] text-center text-[12px] text-red-300">
              {error}
            </p>
          )}

          {!data && !error && (
            <p className="py-[30px] text-center text-[13px] text-white/50">
              불러오는 중...
            </p>
          )}

          {data && !error && (
            <div className="space-y-[10px]">
              {data.interview_answers.map((a) => (
                <div
                  key={a.question_key}
                  className="rounded-[12px] border border-white/15 bg-white/5 p-[12px]"
                >
                  <p className="text-[12px] font-medium text-[#fde047]">
                    {INTERVIEW_QUESTION_MAP[a.question_key] ?? "질문"}
                  </p>
                  <p className="mt-[5px] text-[13px] leading-[20px] text-white/90">
                    {a.answer}
                  </p>
                </div>
              ))}

              {locked > 0 && (
                <div className="flex items-center justify-center gap-[6px] rounded-[12px] border border-dashed border-white/20 bg-white/5 px-[12px] py-[12px] text-center">
                  <Lock className="size-[13px] text-white/50" />
                  <p className="text-[12px] leading-[18px] text-white/60">
                    잠긴 답변 {locked}개 · 내가 연애 프로필 질문에 답하면 볼 수 있어요
                  </p>
                </div>
              )}

              {data.interview_total === 0 && (
                <p className="py-[24px] text-center text-[13px] leading-[20px] text-white/55">
                  아직 {name}님이 답한 연애 프로필 질문이 없어요.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}