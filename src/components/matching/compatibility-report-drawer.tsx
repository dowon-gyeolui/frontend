"use client";

import { ArrowRight, Lock, Sparkles, X } from "lucide-react";
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
  onOpenSaju,
  onOpenDateSpots,
  onLeaveRoom,
  onReport,
}: {
  peerId: number;
  open: boolean;
  onClose: () => void;
  /** "운명의 실타래" 버튼 — 자미두수 페이지로. */
  onOpenSaju: () => void;
  /** "두 분만을 위한 최적의 데이트 코스" 버튼 — 데이트 추천 페이지로. */
  onOpenDateSpots: () => void;
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
        aria-label="운명 분석 리포트"
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
            운명 분석 리포트
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
                  { atPct: 0, text: "두 분의 사주 비교하는 중..." },
                  { atPct: 35, text: "잘 맞는 점·주의할 점 찾는 중..." },
                  { atPct: 65, text: "리포트 정리 중..." },
                  { atPct: 88, text: "거의 다 됐어요!" },
                ]}
              />
            </div>
          )}

          {error && !loading && (
            <p className="rounded-[10px] border border-red-400/40 bg-red-500/10 p-[12px] text-[12px] text-red-200">
              리포트를 불러오지 못했어요. {error}
            </p>
          )}

          {report && !loading && !error && (
            <>
              {/* Summary section */}
              <h3 className="text-center text-[15px] font-semibold text-white">
                상대방과의 궁합 간단 요약
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
                인연 키워드
              </h3>
              <div className="mt-[10px] flex flex-wrap justify-center gap-[6px] rounded-[14px] border border-white/15 bg-white/10 px-[12px] py-[10px] backdrop-blur-sm">
                {report.keywords.map((kw) => (
                  <span key={kw} className="text-[13px] text-[#ffef9a]">
                    {kw}
                  </span>
                ))}
              </div>

              {/* CTA cards — each opens its own 풀이 page (무료 제공) */}
              <div className="mt-[18px] space-y-[10px]">
                <CtaCard
                  title="운명의 실타래 더 깊이 알아보기"
                  height={84}
                  onClick={onOpenSaju}
                />
                <CtaCard
                  title="두 분만을 위한 최적의 데이트 코스"
                  height={104}
                  onClick={onOpenDateSpots}
                />
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

function CtaCard({
  title,
  height,
  onClick,
}: {
  title: string;
  height: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height,
        backgroundImage:
          "linear-gradient(93deg, rgb(124, 58, 237) 0%, rgb(168, 85, 247) 100%)",
      }}
      className="relative w-full rounded-[18px] border-[1.5px] border-white/10 px-[16px] text-left text-white shadow-[0_0_10px_3px_rgba(90,58,130,0.6)] hover:opacity-95"
    >
      <Lock className="absolute left-[14px] top-[12px] size-[14px] fill-white/80 stroke-white/80" />
      <div className="flex h-full flex-col items-center justify-center gap-[6px]">
        <span className="text-center text-[14px] font-bold leading-[20px]">{title}</span>
        <span className="flex items-center gap-[4px] text-[11px] text-white/85">
          <Sparkles className="size-[12px] fill-yellow-300 stroke-yellow-300" />
          프리미엄 가입 후 열람
          <ArrowRight className="size-[12px] stroke-white/85 stroke-[2]" />
        </span>
      </div>
    </button>
  );
}