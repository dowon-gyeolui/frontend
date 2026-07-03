"use client";
// 온보딩 4단계(/onboarding/ideal-type) — 선호 나이대/지역/최소 키 입력 페이지

import { useRouter } from "next/navigation";
import { useState } from "react";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { BIRTH_PLACE_OPTIONS } from "@/lib/birth-place";
import { useOnboarding } from "@/lib/onboarding-context";

const AGE_OPTIONS = Array.from({ length: 99 - 18 + 1 }, (_, i) => 18 + i);
const HEIGHT_OPTIONS = Array.from({ length: 200 - 140 + 1 }, (_, i) => 140 + i);

const SELECT_CLASS =
  "w-full rounded-[8px] border border-white/20 bg-white/10 px-[14px] py-[12px] text-[16px] text-white focus:outline-none focus:ring-2 focus:ring-[#a855f7]";

export default function OnboardingIdealTypePage() {
  const router = useRouter();
  const { state, update } = useOnboarding();

  const [ageMin, setAgeMin] = useState<string>(
    state.pref_age_min != null ? String(state.pref_age_min) : "",
  );
  const [ageMax, setAgeMax] = useState<string>(
    state.pref_age_max != null ? String(state.pref_age_max) : "",
  );
  const [region, setRegion] = useState<string>(state.pref_region ?? "");
  const [heightMin, setHeightMin] = useState<string>(
    state.pref_height_min != null ? String(state.pref_height_min) : "",
  );

  const ageMinN = ageMin ? Number(ageMin) : null;
  const ageMaxN = ageMax ? Number(ageMax) : null;
  const ageRangeValid =
    ageMinN !== null && ageMaxN !== null && ageMinN <= ageMaxN;

  const canContinue =
    ageRangeValid && region !== "" && heightMin !== "";

  const onNext = () => {
    if (!canContinue) return;
    update({
      pref_age_min: ageMinN ?? undefined,
      pref_age_max: ageMaxN ?? undefined,
      pref_region: region,
      pref_height_min: Number(heightMin),
    });
    router.push("/onboarding/interview");
  };

  return (
    <OnboardingShell step={4}>
      <div className="flex flex-1 flex-col px-[36px] pb-[40px]">
        <div className="flex flex-1 flex-col justify-start gap-[24px] pt-[40px]">
          <div className="flex flex-col gap-[10px]">
            <h1 className="text-center text-[24px] font-bold tracking-tight text-white">
              어떤 인연을
              <br />
              찾고 계신가요?
            </h1>
            <p className="text-center text-[14px] text-white/60">
              오늘의 인연을 추천할 때 사용돼요.
            </p>
          </div>

          <div className="flex flex-col gap-[8px]">
            <label className="text-[15px] font-medium text-white/90">
              선호 나이대
            </label>
            <div className="flex items-center gap-[10px]">
              <select
                value={ageMin}
                onChange={(e) => setAgeMin(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">최소</option>
                {AGE_OPTIONS.map((a) => (
                  <option key={a} value={a} className="text-black">
                    {a}세
                  </option>
                ))}
              </select>
              <span className="text-white/60">~</span>
              <select
                value={ageMax}
                onChange={(e) => setAgeMax(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">최대</option>
                {AGE_OPTIONS.map((a) => (
                  <option key={a} value={a} className="text-black">
                    {a}세
                  </option>
                ))}
              </select>
            </div>
            {ageMinN !== null && ageMaxN !== null && ageMinN > ageMaxN && (
              <p className="text-[12px] text-pink-300">
                최소 나이가 최대 나이보다 클 수 없어요.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-[8px]">
            <label className="text-[15px] font-medium text-white/90">
              선호 지역
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">지역을 선택해주세요</option>
              {BIRTH_PLACE_OPTIONS.map((r) => (
                <option key={r} value={r} className="text-black">
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-[8px]">
            <label className="text-[15px] font-medium text-white/90">
              선호 최소 키
            </label>
            <select
              value={heightMin}
              onChange={(e) => setHeightMin(e.target.value)}
              className={SELECT_CLASS}
            >
              <option value="">키를 선택해주세요</option>
              {HEIGHT_OPTIONS.map((h) => (
                <option key={h} value={h} className="text-black">
                  {h}cm 이상
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-[40px] flex gap-[10px]">
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
