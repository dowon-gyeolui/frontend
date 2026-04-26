"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import {
  useOnboarding,
  type CalendarType,
} from "@/lib/onboarding-context";

export default function OnboardingBirthDatePage() {
  const router = useRouter();
  const { state, update } = useOnboarding();

  const [birthDate, setBirthDate] = useState(state.birth_date ?? "");
  const [calendar, setCalendar] = useState<CalendarType | undefined>(
    state.calendar_type,
  );
  const [isLeap, setIsLeap] = useState<boolean>(state.is_leap_month ?? false);

  const canContinue =
    /^\d{4}-\d{2}-\d{2}$/.test(birthDate) && calendar !== undefined;

  const onNext = () => {
    if (!canContinue) return;
    update({
      birth_date: birthDate,
      calendar_type: calendar,
      // Leap month is meaningful only for lunar calendars; force false on solar.
      is_leap_month: calendar === "lunar" ? isLeap : false,
    });
    router.push("/onboarding/birth-time");
  };

  return (
    <OnboardingShell step={2}>
      <div className="flex flex-1 flex-col px-[36px]">
        <h1 className="mt-[150px] text-center text-[24px] font-bold text-white tracking-tight">
          당신이 우주에
          <br />
          기록된 날은 언제인가요?
        </h1>

        {/* Date input — using native date input for now; design can be polished later */}
        <div className="mt-[36px]">
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="h-[52px] w-full rounded-[5px] border border-[#5a3a82] bg-[#352052] px-4 text-center text-[18px] font-medium text-white placeholder:text-white/70 focus:border-white/60 focus:outline-none [color-scheme:dark]"
          />
        </div>

        {/* Calendar type pick */}
        <div className="mt-[20px] flex gap-[10px]">
          <button
            type="button"
            onClick={() => setCalendar("solar")}
            className={`h-[52px] flex-1 rounded-[5px] text-[22px] font-bold text-white transition ${
              calendar === "solar"
                ? "bg-[#ec4899] shadow-[0px_4px_15px_-2px_rgba(236,72,153,0.5)]"
                : "bg-[#ec4899]/40 hover:bg-[#ec4899]/70"
            }`}
          >
            양력
          </button>
          <button
            type="button"
            onClick={() => setCalendar("lunar")}
            className={`h-[52px] flex-1 rounded-[5px] text-[22px] font-bold text-white transition ${
              calendar === "lunar"
                ? "bg-[#6366f1] shadow-[0px_4px_15px_-2px_rgba(99,102,241,0.5)]"
                : "bg-[#6366f1]/40 hover:bg-[#6366f1]/70"
            }`}
          >
            음력
          </button>
        </div>

        {/* Leap month — only meaningful for lunar */}
        {calendar === "lunar" && (
          <label className="mt-[8px] flex cursor-pointer items-center justify-end gap-[6px] pr-[4px] text-[15px] text-white">
            <input
              type="checkbox"
              checked={isLeap}
              onChange={(e) => setIsLeap(e.target.checked)}
              className="size-[14px] cursor-pointer accent-white"
            />
            윤달
          </label>
        )}

        {/* Bottom: 이전 + 다음 */}
        <div className="mt-auto flex gap-[10px] pb-[40px]">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-[52px] flex-1 rounded-[5px] border border-white/20 text-[18px] font-semibold text-white shadow-[0px_0px_15px_0px_rgba(139,92,246,0.35)]"
            style={{
              backgroundImage:
                "linear-gradient(108deg, rgb(168, 85, 247) 0%, rgb(124, 58, 237) 100%)",
            }}
          >
            이전
          </button>
          <button
            type="button"
            disabled={!canContinue}
            onClick={onNext}
            className={`h-[52px] flex-1 rounded-[5px] text-[18px] font-semibold transition ${
              canContinue
                ? "bg-[#6366f1] text-white shadow-[0px_4px_15px_-2px_rgba(99,102,241,0.5)] hover:opacity-90"
                : "bg-[rgba(75,58,112,0.7)] text-white/40"
            }`}
          >
            다음
          </button>
        </div>
      </div>
    </OnboardingShell>
  );
}