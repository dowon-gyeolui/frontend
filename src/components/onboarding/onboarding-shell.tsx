"use client";
// 역할 설명: 온보딩 화면 공통 셸 — 그라디언트 배경, 상단 로고 바, 진행 단계 표시

import { User } from "lucide-react";
import type { ReactNode } from "react";

import { ZamiLogo } from "@/components/brand/zami-logo";

export type OnboardingShellProps = {
  step: 1 | 2 | 3 | 4 | 5;
  children: ReactNode;
};

const TOTAL_STEPS = 5;

export function OnboardingShell({ step, children }: OnboardingShellProps) {
  return (
    <div
      className="relative flex min-h-dvh w-full flex-1 flex-col overflow-hidden"
      style={{
        background:
          "linear-gradient(to bottom, #12081f 0%, #2a0e4f 50%, #5e35b1 100%)",
      }}
    >
      <div className="relative pt-[39px]">
        <div className="flex items-center justify-between px-[24px]">
          <ZamiLogo size="sm" />
          <User className="size-[25px] stroke-white stroke-[1.5]" />
        </div>
        <div className="mt-[14px] h-px bg-white/40" />
      </div>

      <div className="relative pt-[14px]">
        <p className="text-center text-[18px] font-semibold text-white">
          필수 정보 입력
        </p>
        <div className="mt-[15px] flex items-center justify-center gap-[5px] px-[20px]">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-px max-w-[120px] flex-1 ${
                i + 1 <= step ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}