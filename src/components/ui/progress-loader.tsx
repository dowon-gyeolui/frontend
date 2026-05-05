"use client";

import { useEffect, useState } from "react";

/**
 * Single-shot progress loader — gauge fills exponentially toward 95%
 * over `estimatedMs`, then asymptotic creep until `done` flips to true
 * (which jumps it to 100%). Different messages appear at different
 * percentage thresholds so the user feels progress instead of a
 * silent spinner.
 *
 * Why exponential (not linear):
 *  - Linear hits 95% exactly at estimatedMs and feels "stuck" if the
 *    call takes longer.
 *  - Exponential makes early progress fast (rewarding) and slow near
 *    the end (honest) — matches what users perceive as "loading well".
 *
 * Usage:
 *   <ProgressLoader
 *     estimatedMs={10000}
 *     done={!!data}
 *     messages={[
 *       { atPct: 0,  text: "시작..." },
 *       { atPct: 30, text: "분석 중..." },
 *       { atPct: 70, text: "거의 다 됐어요" },
 *     ]}
 *   />
 */
export type ProgressMessage = {
  /** 표시 시작 임계값 (%). 이전 임계값보다 같거나 커야 함. */
  atPct: number;
  text: string;
};

export function ProgressLoader({
  estimatedMs,
  done,
  messages,
  size = "md",
  showPct = true,
}: {
  estimatedMs: number;
  done?: boolean;
  messages: ProgressMessage[];
  size?: "sm" | "md";
  showPct?: boolean;
}) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (done) {
      setPct(100);
      return;
    }
    const start = Date.now();
    // Tick at 100ms — smooth enough, no perf hit.
    const tick = () => {
      const elapsed = Date.now() - start;
      // Exponentially approach 95%. tau = estimatedMs / 3 means we hit
      // ~63% at estimatedMs/3, ~86% at 2*estimatedMs/3, ~95% at estimatedMs.
      // After estimatedMs we keep crawling the last few % asymptotically.
      const tau = estimatedMs / 3;
      const next = 95 * (1 - Math.exp(-elapsed / tau));
      setPct(next);
    };
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [estimatedMs, done]);

  // Pick the highest-threshold message whose atPct ≤ current pct.
  let currentText = messages[0]?.text ?? "";
  for (const m of messages) {
    if (pct >= m.atPct) currentText = m.text;
  }

  const trackHeight = size === "sm" ? "h-[5px]" : "h-[7px]";
  const containerWidth = size === "sm" ? "max-w-[200px]" : "max-w-[280px]";

  return (
    <div className={`mx-auto w-full ${containerWidth}`}>
      <div
        className={`relative ${trackHeight} w-full overflow-hidden rounded-full bg-white/10`}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`${trackHeight} rounded-full bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400 transition-[width] duration-200 ease-out`}
          style={{ width: `${pct}%` }}
        />
        {/* Subtle shimmer overlay — adds life without heavy animation */}
        <div
          className="pointer-events-none absolute inset-0 animate-pulse rounded-full bg-white/0"
          aria-hidden
        />
      </div>
      <div className="mt-[10px] flex items-baseline justify-between gap-[8px]">
        <p className="flex-1 text-[12px] leading-[18px] text-white/75">
          {currentText}
        </p>
        {showPct && (
          <span className="shrink-0 text-[11px] font-semibold text-white/50">
            {Math.floor(pct)}%
          </span>
        )}
      </div>
    </div>
  );
}