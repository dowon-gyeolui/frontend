"use client";
// 온보딩 마지막 단계(/onboarding/done) — 프로필/생년월일 저장 후 사주 분석 결과 표시

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { LoadingPanel } from "@/components/ui/loading-panel";
import { apiFetch } from "@/lib/api";
import { cacheSet } from "@/lib/cache";
import { useOnboarding } from "@/lib/onboarding-context";
import {
  BRANCH_DATA,
  ELEMENT_DISPLAY,
  STEM_HANJA,
  dominantElement,
  type ElementProfile,
  type SajuPillar,
} from "@/lib/saju";

type DetailedSajuResponse = {
  pillars: SajuPillar[];
  element_profile: ElementProfile;
  personality: string;
  love: string;
  wealth: string;
  advice: string;
  interpretation_status?: "pending" | "ready";
};

type SubmitState =
  | { kind: "submitting" }
  | { kind: "analyzing" }
  | { kind: "ready"; saju: DetailedSajuResponse | null; nickname: string }
  | { kind: "error"; message: string };

export default function OnboardingDonePage() {
  const router = useRouter();
  const { state, reset } = useOnboarding();
  const [status, setStatus] = useState<SubmitState>({ kind: "submitting" });

  useEffect(() => {
    let cancelled = false;

    async function submit() {
      if (!state.nickname || !state.gender || !state.birth_date || !state.calendar_type) {
        router.replace("/onboarding/name");
        return;
      }

      const nickname = state.nickname;

      try {
        await apiFetch("/users/me/profile", {
          method: "PATCH",
          body: JSON.stringify({
            nickname,
            pref_age_min: state.pref_age_min,
            pref_age_max: state.pref_age_max,
            pref_region: state.pref_region,
            pref_height_min: state.pref_height_min,
          }),
        });

        await apiFetch("/users/me/birth-data", {
          method: "POST",
          body: JSON.stringify({
            birth_date: state.birth_date,
            birth_time: state.birth_time ?? null,
            calendar_type: state.calendar_type,
            is_leap_month: state.is_leap_month ?? false,
            gender: state.gender,
            birth_place: state.birth_place ?? null,
          }),
        });
        if (cancelled) return;

        if (state.interview && state.interview.length > 0) {
          try {
            await apiFetch("/users/me/interview", {
              method: "PUT",
              body: JSON.stringify({ answers: state.interview }),
            });
          } catch {
          }
        }

        setStatus({ kind: "analyzing" });
        // 자미두수 심층 풀이도 미리 생성시켜 둔다(서버 백그라운드 생성 트리거).
        apiFetch("/saju/me/jamidusu-deep").catch(() => {});
        try {
          const saju = await apiFetch<DetailedSajuResponse>("/saju/me/detailed");
          if (cancelled) return;
          if (saju.interpretation_status === "ready") {
            cacheSet("/saju/me/detailed", saju);
          }
          setStatus({ kind: "ready", saju, nickname });
        } catch {
          if (cancelled) return;
          setStatus({ kind: "ready", saju: null, nickname });
        }
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
    <OnboardingShell step={6}>
      <div className="flex flex-1 flex-col items-center justify-center px-[24px] pb-[40px]">
        {status.kind === "submitting" && (
          <>
            <h1 className="text-center text-[24px] font-bold tracking-tight text-white">
              {state.nickname ?? ""} 님의 정보를 저장하고 있어요...
            </h1>
            <div className="mt-[40px] w-full">
              <LoadingPanel
                estimatedMs={2000}
                done={false}
                messages={[
                  { atPct: 0, text: "프로필 저장 중..." },
                  { atPct: 50, text: "데이터 저장 중..." },
                  { atPct: 85, text: "거의 다 됐어요" },
                ]}
              />
            </div>
          </>
        )}

        {status.kind === "analyzing" && (
          <>
            <h1 className="mt-[14px] text-center text-[22px] font-bold text-white">
              {state.nickname ?? ""} 님의 운명을 풀어보고 있어요
            </h1>
            <div className="mt-[28px] w-full">
              <LoadingPanel
                estimatedMs={9000}
                done={false}
                messages={[
                  { atPct: 0, text: "사주 분석하는 중..." },
                  { atPct: 25, text: "오행 분석 중..." },
                  { atPct: 50, text: "해석하는 중..." },
                  { atPct: 70, text: "사주풀이 작성 중..." },
                  { atPct: 90, text: "거의 다 왔어요!" },
                ]}
              />
            </div>
          </>
        )}

        {status.kind === "ready" && (
          <ReadyView
            nickname={status.nickname}
            saju={status.saju}
            onGoSaju={() => router.replace("/saju")}
            onGoHome={() => router.replace("/home")}
          />
        )}

        {status.kind === "error" && (
          <>
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

function ReadyView({
  nickname,
  saju,
  onGoSaju,
  onGoHome,
}: {
  nickname: string;
  saju: DetailedSajuResponse | null;
  onGoSaju: () => void;
  onGoHome: () => void;
}) {
  const dayPillar = saju?.pillars[2];
  const dominant = saju ? dominantElement(saju.element_profile) : null;
  const dominantKo = dominant ? ELEMENT_DISPLAY[dominant].ko : null;
  const dominantHanja = dominant ? ELEMENT_DISPLAY[dominant].hanja : null;
  const dayHanja = dayPillar
    ? `${STEM_HANJA[dayPillar.stem]?.hanja ?? "?"}${BRANCH_DATA[dayPillar.branch]?.hanja ?? "?"}`
    : null;

  return (
    <div className="flex w-full flex-col items-center">
      <h1 className="mt-[12px] text-center text-[22px] font-bold tracking-tight text-white">
        {nickname} 님의 사주를 풀었어요
      </h1>

      {saju && dayPillar && dominant && (
        <div className="mt-[20px] w-full max-w-[340px] space-y-[12px]">
          <div className="grid grid-cols-2 gap-[10px]">
            <InfoBox label="일주" value={dayPillar.combined} hanja={dayHanja} />
            <InfoBox
              label="주요 오행"
              value={dominantKo ?? ""}
              hanja={dominantHanja ?? ""}
            />
          </div>

          {saju.personality && (
            <NarrativeCard title="성격" body={saju.personality} />
          )}
          {saju.advice && <NarrativeCard title="조언" body={saju.advice} />}
        </div>
      )}

      {!saju && (
        <p className="mt-[16px] max-w-[300px] text-center text-[13px] leading-[20px] text-white/70">
          일시적으로 오류가 발생했어요. 자세한 풀이는{" "}
          <span className="text-purple-300">사주 페이지</span> 에서 확인할 수 있어요.
        </p>
      )}

      <div className="mt-[24px] flex w-full max-w-[340px] flex-col gap-[10px]">
        <button
          type="button"
          onClick={onGoSaju}
          className="h-[48px] w-full rounded-[12px] text-[16px] font-semibold text-white shadow-[0_0_15px_-2px_rgba(168,85,247,0.5)]"
          style={{
            backgroundImage:
              "linear-gradient(99deg, rgb(124, 58, 237) 0%, rgb(168, 85, 247) 100%)",
          }}
        >
          내 사주 보러가기
        </button>
        <button
          type="button"
          onClick={onGoHome}
          className="h-[48px] w-full rounded-[12px] border border-white/20 bg-white/5 text-[16px] font-medium text-white hover:bg-white/10"
        >
          홈으로 가기
        </button>
      </div>
    </div>
  );
}

function InfoBox({
  label,
  value,
  hanja,
}: {
  label: string;
  value: string;
  hanja: string | null;
}) {
  return (
    <div className="rounded-[12px] border border-white/15 bg-white/5 p-[12px] text-center backdrop-blur-sm">
      <p className="text-[11px] text-white/60">{label}</p>
      <p className="mt-[4px] text-[18px] font-bold text-white">{value}</p>
      {hanja && <p className="text-[11px] text-white/40">{hanja}</p>}
    </div>
  );
}

function NarrativeCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[12px] border border-white/15 bg-white/5 p-[14px] backdrop-blur-sm">
      <h3 className="text-[13px] font-semibold text-[#fde047]">{title}</h3>
      <p className="mt-[6px] text-[12px] leading-[20px] text-white/85">{body}</p>
    </div>
  );
}