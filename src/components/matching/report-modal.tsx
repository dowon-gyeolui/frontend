"use client";

import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";

type Reason = "inappropriate" | "fake" | "spam" | "other";

const REASONS: { id: Reason; title: string; desc: string }[] = [
  {
    id: "inappropriate",
    title: "부적절한 대화",
    desc: "비속어 및 욕설, 성희롱 등 불쾌한 언어를 사용",
  },
  {
    id: "fake",
    title: "허위 정보 및 사칭",
    desc: "사진 도용이나 나이, 성별 등을 속인 것이 의심돼요",
  },
  {
    id: "spam",
    title: "상업적 목적 및 스팸",
    desc: "광고 및 홍보, 금전 요구를 해요",
  },
  {
    id: "other",
    title: "기타",
    desc: "직접 입력 — 구체적인 상황을 알려주세요",
  },
];

/**
 * 운명 분석 리포트 drawer 의 신고하기 버튼이 띄우는 모달.
 * 4개 카테고리 토글 + 기타 직접 입력. 제출 시 POST /reports.
 */
export function ReportModal({
  reportedUserId,
  onClose,
  onSubmitted,
}: {
  reportedUserId: number;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [reason, setReason] = useState<Reason | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  const canSubmit =
    reason !== null && (reason !== "other" || details.trim().length > 0);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/reports", {
        method: "POST",
        body: JSON.stringify({
          reported_user_id: reportedUserId,
          reason,
          // Always send details when present — even non-other reasons can carry context.
          details: details.trim() || undefined,
        }),
      });
      onSubmitted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "신고 실패");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/65 backdrop-blur-[3px] p-[20px]"
      onClick={() => (submitting ? null : onClose())}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[360px] overflow-hidden rounded-[18px] border border-white/15 bg-[#1f1235] p-[18px] shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          disabled={submitting}
          className="absolute right-[14px] top-[14px] grid size-[24px] place-items-center"
        >
          <X className="size-[20px] stroke-white/85 stroke-[2]" />
        </button>

        <h2 className="text-center text-[18px] font-bold text-white">
          신고하기
        </h2>
        <p className="mt-[6px] text-center text-[12px] leading-[18px] text-white/60">
          신고 내용은 운영팀이 대화 기록과 함께 검토합니다.
          <br />
          허위 신고 시 이용에 제한이 있을 수 있어요.
        </p>

        {/* 신고 사유 선택 */}
        <div className="mt-[14px] space-y-[8px]">
          {REASONS.map((r) => {
            const active = reason === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setReason(r.id)}
                className={`flex w-full items-start gap-[10px] rounded-[12px] border p-[12px] text-left transition ${
                  active
                    ? "border-purple-400 bg-purple-500/15 shadow-[0_0_12px_-2px_rgba(168,85,247,0.5)]"
                    : "border-white/15 bg-white/5 hover:bg-white/10"
                }`}
              >
                <span
                  className={`mt-[2px] grid size-[18px] flex-shrink-0 place-items-center rounded-full border ${
                    active
                      ? "border-purple-400 bg-purple-500"
                      : "border-white/30"
                  }`}
                >
                  {active && <Check className="size-[12px] stroke-white stroke-[3]" />}
                </span>
                <span>
                  <p className="text-[14px] font-semibold text-white">{r.title}</p>
                  <p className="mt-[2px] text-[11px] leading-[16px] text-white/65">
                    {r.desc}
                  </p>
                </span>
              </button>
            );
          })}
        </div>

        {/* 기타 카테고리 textarea — reason 이 other 일 때만 활성 */}
        {reason === "other" && (
          <div className="mt-[12px]">
            <label className="text-[12px] font-medium text-white/80">
              상황을 자세히 알려주세요{" "}
              <span className="text-white/40">({details.length}/1000)</span>
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={1000}
              rows={3}
              autoFocus
              placeholder="예: 거짓말 / 광고 / 비속어 / 기타 불쾌했던 점 등"
              className="mt-[6px] w-full resize-none rounded-[10px] border border-white/15 bg-white/10 p-[10px] text-[13px] text-white placeholder:text-white/40 focus:border-purple-300 focus:outline-none"
            />
          </div>
        )}

        {error && (
          <p className="mt-[10px] text-center text-[11px] text-red-300">{error}</p>
        )}

        {/* CTAs */}
        <div className="mt-[14px] flex gap-[8px]">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-[44px] flex-1 rounded-[12px] border border-white/15 bg-white/5 text-[14px] font-medium text-white/80 hover:bg-white/10 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="h-[44px] flex-1 rounded-[12px] bg-[rgba(255,95,95,0.9)] text-[14px] font-bold text-white shadow-[0_0_10px_-2px_rgba(255,95,95,0.6)] hover:bg-[rgba(255,95,95,1)] disabled:bg-white/15 disabled:text-white/40 disabled:shadow-none"
          >
            {submitting ? "전송 중..." : "신고 접수"}
          </button>
        </div>
      </div>
    </div>
  );
}