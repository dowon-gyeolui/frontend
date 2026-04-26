"use client";

import { User } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Shared shell for every onboarding screen — gradient background, top logo
 * bar, and a 3-segment progress indicator. ``step`` is 1-based and matches
 * the segment that should appear filled.
 */
export type OnboardingShellProps = {
  step: 1 | 2 | 3;
  children: ReactNode;
};

const TOTAL_STEPS = 3;

export function OnboardingShell({ step, children }: OnboardingShellProps) {
  return (
    <div
      className="relative flex min-h-dvh w-full flex-1 flex-col overflow-hidden"
      style={{
        background:
          "linear-gradient(to bottom, #12081f 0%, #2a0e4f 50%, #5e35b1 100%)",
      }}
    >
      {/* Top bar — ZAMI logo + user icon + bottom border */}
      <div className="relative pt-[39px]">
        <div className="flex items-center justify-between px-[24px]">
          <span
            className="text-[18px] font-bold text-white"
            style={{ letterSpacing: "0.4em" }}
          >
            ZAMI
          </span>
          <User className="size-[25px] stroke-white stroke-[1.5]" />
        </div>
        <div className="mt-[14px] h-px bg-white/40" />
      </div>

      {/* Step header */}
      <div className="relative pt-[14px]">
        <p className="text-center text-[18px] font-semibold text-white">
          필수 정보 입력
        </p>
        <div className="mt-[15px] flex items-center justify-center gap-[5px] px-[20px]">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-px w-[120px] ${
                i + 1 <= step ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content slot */}
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}