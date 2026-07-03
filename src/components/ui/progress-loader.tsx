"use client";
// 역할 설명: 예상 소요 시간을 기반으로 진행률을 채우는 1회성 progress bar

import { useEffect, useState } from "react";

export type ProgressMessage = {
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
    const tick = () => {
      const elapsed = Date.now() - start;
      const tau = estimatedMs / 3;
      const next = 95 * (1 - Math.exp(-elapsed / tau));
      setPct(next);
    };
    tick();
    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [estimatedMs, done]);

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