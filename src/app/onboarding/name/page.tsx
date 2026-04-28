"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboarding, type Gender } from "@/lib/onboarding-context";

export default function OnboardingNamePage() {
  const router = useRouter();
  const { state, update } = useOnboarding();

  const [nickname, setNickname] = useState(state.nickname ?? "");
  const [gender, setGender] = useState<Gender | undefined>(state.gender);

  // "다음" button is enabled only after both fields are populated.
  const canContinue = nickname.trim().length >= 1 && gender !== undefined;

  const onNext = () => {
    if (!canContinue) return;
    update({ nickname: nickname.trim(), gender });
    router.push("/onboarding/birth-date");
  };

  return (
    <OnboardingShell step={1}>
      <div className="flex flex-1 flex-col px-[36px] pb-[40px]">
        {/* Form group — vertically centered between step header and CTA so
            the layout looks symmetric on tall and short viewports alike. */}
        <div className="flex flex-1 flex-col justify-center gap-[26px] pt-[20px]">
          <h1 className="text-center text-[24px] font-bold tracking-tight text-white">
            당신은 누구인가요?
          </h1>

          <input
            type="text"
            inputMode="text"
            placeholder="이름을 입력하세요."
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            className="h-[52px] w-full rounded-[12px] border border-[#5a3a82] bg-[#352052] px-4 text-center text-[18px] font-medium text-white placeholder:text-white/70 focus:border-white/60 focus:outline-none"
          />

          <div className="flex gap-[10px]">
            <button
              type="button"
              onClick={() => setGender("male")}
              className={`h-[52px] flex-1 rounded-[5px] text-[22px] font-bold text-white transition ${
                gender === "male"
                  ? "bg-[#6366f1] shadow-[0px_4px_15px_-2px_rgba(99,102,241,0.5)]"
                  : "bg-[#6366f1]/40 hover:bg-[#6366f1]/70"
              }`}
            >
              남자
            </button>
            <button
              type="button"
              onClick={() => setGender("female")}
              className={`h-[52px] flex-1 rounded-[5px] text-[22px] font-bold text-white transition ${
                gender === "female"
                  ? "bg-[#ec4899] shadow-[0px_4px_15px_-2px_rgba(236,72,153,0.5)]"
                  : "bg-[#ec4899]/40 hover:bg-[#ec4899]/70"
              }`}
            >
              여자
            </button>
          </div>
        </div>

        {/* Bottom CTA — sits at the bottom of the column thanks to the
            form group's flex-1; pt-[40px] enforces a minimum breathing gap
            even when the viewport is tiny. */}
        <button
          type="button"
          disabled={!canContinue}
          onClick={onNext}
          className={`mt-[40px] h-[52px] w-full rounded-[5px] text-[18px] font-semibold transition ${
            canContinue
              ? "bg-[#6366f1] text-white shadow-[0px_4px_15px_-2px_rgba(99,102,241,0.5)] hover:opacity-90"
              : "bg-[rgba(75,58,112,0.7)] text-white/40"
          }`}
        >
          다음
        </button>
      </div>
    </OnboardingShell>
  );
}