"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { apiFetch } from "@/lib/api";
import { useOnboarding } from "@/lib/onboarding-context";

type SubmitState =
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export default function OnboardingDonePage() {
  const router = useRouter();
  const { state, reset } = useOnboarding();
  const [status, setStatus] = useState<SubmitState>({ kind: "submitting" });

  useEffect(() => {
    let cancelled = false;

    async function submit() {
      // Guard: if the user reloaded straight onto /onboarding/done with an
      // empty context, kick them back to step 1 instead of POSTing nothing.
      if (!state.nickname || !state.gender || !state.birth_date || !state.calendar_type) {
        router.replace("/onboarding/name");
        return;
      }

      try {
        // 1) Nickname → PATCH /users/me/profile
        await apiFetch("/users/me/profile", {
          method: "PATCH",
          body: JSON.stringify({ nickname: state.nickname }),
        });

        // 2) Birth data → POST /users/me/birth-data
        await apiFetch("/users/me/birth-data", {
          method: "POST",
          body: JSON.stringify({
            birth_date: state.birth_date,
            birth_time: state.birth_time ?? null,
            calendar_type: state.calendar_type,
            is_leap_month: state.is_leap_month ?? false,
            gender: state.gender,
          }),
        });

        if (cancelled) return;
        setStatus({ kind: "success" });
        reset();
      } catch (e) {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : "Unknown error";
        setStatus({ kind: "error", message });
      }
    }

    submit();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <OnboardingShell step={3}>
      <div className="flex flex-1 flex-col items-center justify-center px-[36px]">
        {status.kind === "submitting" && (
          <>
            <h1 className="text-center text-[24px] font-bold text-white tracking-tight">
              {state.nickname ?? ""} 님의 운명을 엿보는 중입니다...
            </h1>
            <div className="mt-[40px] size-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          </>
        )}

        {status.kind === "success" && (
          <>
            <div className="text-[64px]">✨</div>
            <h1 className="mt-[16px] text-center text-[28px] font-bold text-white">
              준비 완료!
            </h1>
            <p className="mt-[10px] text-center text-[16px] text-white/70">
              운명의 인연을 만나러 가볼까요?
            </p>
            <button
              type="button"
              onClick={() => router.replace("/home")}
              className="mt-[40px] h-[52px] w-full rounded-[5px] bg-[#6366f1] text-[18px] font-semibold text-white shadow-[0px_4px_15px_-2px_rgba(99,102,241,0.5)]"
            >
              시작하기
            </button>
          </>
        )}

        {status.kind === "error" && (
          <>
            <div className="text-[48px]">⚠️</div>
            <h1 className="mt-[16px] text-center text-[20px] font-bold text-white">
              저장하지 못했어요
            </h1>
            <p className="mt-[10px] text-center text-[14px] text-red-300">
              {status.message}
            </p>
            <div className="mt-[32px] flex w-full gap-[10px]">
              <button
                type="button"
                onClick={() => router.replace("/onboarding/name")}
                className="h-[52px] flex-1 rounded-[5px] border border-white/20 text-[18px] font-semibold text-white"
                style={{
                  backgroundImage:
                    "linear-gradient(108deg, rgb(168, 85, 247) 0%, rgb(124, 58, 237) 100%)",
                }}
              >
                처음부터
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="h-[52px] flex-1 rounded-[5px] bg-[#6366f1] text-[18px] font-semibold text-white"
              >
                다시 시도
              </button>
            </div>
          </>
        )}
      </div>
    </OnboardingShell>
  );
}