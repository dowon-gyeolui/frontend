"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { LoadingPanel } from "@/components/ui/loading-panel";
import { apiFetch } from "@/lib/api";

export type CompatibilityReport = {
  user_a_id: number;
  user_b_id: number;
  nickname_a: string | null;
  nickname_b: string | null;
  score: number;
  summary_lines: string[];
  keywords: string[];
};

/**
 * 운명 분석 리포트 드로우 — 채팅 헤더의 햄버거 아이콘을 누르면 우측에서 슬라이드인.
 *
 * Figma node 37:1657. 본문은 백엔드 GET /compatibility/report/{peer_id} 가
 * 채워주고, 두 CTA(운명의 실타래 / 데이트 추천)는 프리미엄 게이팅이라 잠긴
 * 상태로 잠금 아이콘과 함께 노출. /jamidusu 로 라우팅된다.
 */
export function CompatibilityReportDrawer({
  peerId,
  open,
  onClose,
  onLeaveRoom,
  onReport,
}: {
  peerId: number;
  open: boolean;
  onClose: () => void;
  onLeaveRoom: () => void;
  onReport: () => void;
}) {
  const [report, setReport] = useState<CompatibilityReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    apiFetch<CompatibilityReport>(`/compatibility/report/${peerId}`)
      .then((r) => {
        setReport(r);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, [open, peerId]);

  // ESC closes the drawer
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-[rgba(27,16,41,0.4)] transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-label="운명 분석 결과"
        aria-hidden={!open}
        className={`fixed bottom-0 right-0 top-0 z-50 flex w-[300px] max-w-[85vw] flex-col rounded-l-[10px] bg-[#352052] shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="relative px-[18px] pt-[28px]">
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="absolute right-[14px] top-[26px]"
          >
            <X className="size-[22px] stroke-white stroke-[2]" />
          </button>
          <h2 className="text-center text-[18px] font-bold text-white">
            운명 분석 결과
          </h2>
          <div className="mt-[14px] h-px bg-white/40" />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-[18px] py-[18px]">
          {loading && (
            <div className="pt-8">
              <LoadingPanel
                estimatedMs={6000}
                done={!loading}
                messages={[
                  { atPct: 0, text: "사주 비교 중..." },
                  { atPct: 35, text: "잘 맞는 점 찾는 중..." },
                  { atPct: 65, text: "분석 정리 중..." },
                  { atPct: 88, text: "거의 다 됐어요!" },
                ]}
              />
            </div>
          )}

          {error && !loading && (
            <p className="rounded-[10px] border border-red-400/40 bg-red-500/10 p-[12px] text-[12px] text-red-200">
              결과를 불러오지 못했어요. {error}
            </p>
          )}

          {report && !loading && !error && (
            <>
              {/* Summary section */}
              <h3 className="text-center text-[15px] font-semibold text-white">
                {report.nickname_a ?? "나"}님과 {report.nickname_b ?? "상대"}님의 궁합 요약
              </h3>
              <ul className="mt-[14px] space-y-[14px]">
                {report.summary_lines.map((line, i) => (
                  <li key={i} className="flex gap-[8px] text-[13px] leading-[20px] text-white">
                    <span className="mt-[2px] shrink-0 text-[14px] text-[#fde047]">✦</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              {/* Score chip */}
              <div className="mt-[16px] flex items-center justify-center gap-[6px] rounded-full border border-white/15 bg-white/10 px-[12px] py-[6px] text-[12px]">
                <span className="text-white/70">사주 궁합 점수</span>
                <span className="font-semibold text-[#fde047]">{report.score}%</span>
              </div>

              {/* Keywords */}
              <h3 className="mt-[20px] text-center text-[15px] font-semibold text-white">
                주요 키워드
              </h3>
              <div className="mt-[10px] flex flex-wrap justify-center gap-[6px] rounded-[14px] border border-white/15 bg-white/10 px-[12px] py-[10px] backdrop-blur-sm">
                {report.keywords.map((kw) => (
                  <span key={kw} className="text-[13px] text-[#ffef9a]">
                    {kw}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bottom action row */}
        <div className="flex gap-[10px] px-[18px] pb-[20px] pt-[10px]">
          <button
            type="button"
            onClick={onReport}
            className="h-[34px] flex-1 rounded-[10px] bg-[rgba(255,95,95,0.9)] text-[14px] font-medium text-black hover:bg-[rgba(255,95,95,1)]"
          >
            신고하기
          </button>
          <button
            type="button"
            onClick={onLeaveRoom}
            className="h-[34px] flex-1 rounded-[10px] bg-[rgba(255,95,95,0.9)] text-[14px] font-medium text-black hover:bg-[rgba(255,95,95,1)]"
          >
            방 나가기
          </button>
        </div>
      </aside>
    </>
  );
}