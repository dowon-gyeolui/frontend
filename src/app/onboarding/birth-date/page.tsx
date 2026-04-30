"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ScrollableDateInput } from "@/components/common/scrollable-date-input";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { BIRTH_PLACE_OPTIONS } from "@/lib/birth-place";
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
  const [birthPlace, setBirthPlace] = useState(state.birth_place ?? "");

  const canContinue =
    /^\d{4}-\d{2}-\d{2}$/.test(birthDate) && calendar !== undefined;

  const onNext = () => {
    if (!canContinue) return;
    update({
      birth_date: birthDate,
      calendar_type: calendar,
      // Leap month is meaningful only for lunar calendars; force false on solar.
      is_leap_month: calendar === "lunar" ? isLeap : false,
      birth_place: birthPlace || undefined,
    });
    router.push("/onboarding/birth-time");
  };

  return (
    <OnboardingShell step={2}>
      <div className="flex flex-1 flex-col px-[36px] pb-[40px]">
        {/* Form group — sits near the top so keyboard / month picker don't
            cover it on mobile. */}
        <div className="flex flex-1 flex-col justify-start gap-[24px] pt-[40px]">
          <h1 className="text-center text-[24px] font-bold tracking-tight text-white">
            당신이 우주에
            <br />
            기록된 날은 언제인가요?
          </h1>

          {/* 휠/키보드로 년·월·일 각각 변경 가능. native date input 은
              모바일에서 월 휠이 안 되는 경우가 많아 자체 위젯으로 교체. */}
          <div className="flex h-[52px] items-center justify-center rounded-[5px] border border-[#5a3a82] bg-[#352052] px-[12px]">
            <ScrollableDateInput value={birthDate} onChange={setBirthDate} />
          </div>

          <div className="flex gap-[10px]">
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

          {calendar === "lunar" && (
            <label className="-mt-[8px] flex cursor-pointer items-center justify-center gap-[6px] text-[15px] text-white">
              <input
                type="checkbox"
                checked={isLeap}
                onChange={(e) => setIsLeap(e.target.checked)}
                className="size-[14px] cursor-pointer accent-white"
              />
              윤달
            </label>
          )}

          {/* 출생지 — 시·도. 사주 시간 보정에 사용 (KST vs 실제 경도 차이) */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-center text-[13px] text-white/70">
              출생지 (선택)
            </label>
            <select
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
              className="h-[52px] w-full rounded-[5px] border border-[#5a3a82] bg-[#352052] px-4 text-center text-[16px] font-medium text-white focus:border-white/60 focus:outline-none"
            >
              <option value="">출생지를 선택하세요</option>
              {BIRTH_PLACE_OPTIONS.map((p) => (
                <option key={p} value={p} className="bg-[#1b0e2e] text-white">
                  {p}
                </option>
              ))}
            </select>
            <p className="text-center text-[10px] text-white/45">
              한국 표준시(KST)와 출생지 경도 차이로 사주 시각을 보정해요.
            </p>
          </div>
        </div>

        {/* Bottom: 이전 + 다음 */}
        <div className="mt-[80px] flex gap-[10px]">
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