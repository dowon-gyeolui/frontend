"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { useOnboarding } from "@/lib/onboarding-context";

export default function OnboardingBirthTimePage() {
  const router = useRouter();
  const { state, update } = useOnboarding();

  const [birthTime, setBirthTime] = useState(state.birth_time ?? "");
  // Birth time is OPTIONAL on the backend — surface a "모름" toggle so the
  // user can skip without typing a fake value.
  const [unknown, setUnknown] = useState<boolean>(state.birth_time === "");

  const canContinue =
    unknown || /^\d{2}:\d{2}$/.test(birthTime);

  const onNext = () => {
    if (!canContinue) return;
    update({ birth_time: unknown ? undefined : birthTime });
    router.push("/onboarding/done");
  };

  return (
    <OnboardingShell step={3}>
      <div className="flex flex-1 flex-col px-[36px] pb-[40px]">
        {/* Form group near the top — keyboard / time picker shouldn't cover it. */}
        <div className="flex flex-1 flex-col justify-start gap-[20px] pt-[40px]">
          <div className="flex flex-col gap-[10px]">
            <h1 className="text-center text-[24px] font-bold tracking-tight text-white">
              태어난 시간을
              <br />
              알려주세요
            </h1>
            <p className="text-center text-[14px] text-white/60">
              정확한 사주 풀이에 사용돼요. 모르면 건너뛸 수 있어요.
            </p>
          </div>

          <input
            type="time"
            value={birthTime}
            onChange={(e) => {
              setBirthTime(e.target.value);
              setUnknown(false);
            }}
            disabled={unknown}
            className="h-[52px] w-full rounded-[5px] border border-[#5a3a82] bg-[#352052] px-4 text-center text-[18px] font-medium text-white placeholder:text-white/70 focus:border-white/60 focus:outline-none disabled:opacity-40 [color-scheme:dark]"
          />

          <label className="flex cursor-pointer items-center justify-center gap-[8px] text-[15px] text-white/80">
            <input
              type="checkbox"
              checked={unknown}
              onChange={(e) => {
                setUnknown(e.target.checked);
                if (e.target.checked) setBirthTime("");
              }}
              className="size-[16px] cursor-pointer accent-white"
            />
            시간 모름
          </label>
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