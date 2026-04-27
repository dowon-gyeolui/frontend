"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { ElementPentagon } from "@/components/saju/element-pentagon";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  BRANCH_DATA,
  ELEMENT_DISPLAY,
  RECOMMENDED_COLOR,
  STEM_DESCRIPTION,
  STEM_HANJA,
  dominantElement,
  weakestElement,
  type ElementProfile,
  type SajuPillar,
  type SajuResponse,
} from "@/lib/saju";

export default function SajuPage() {
  const router = useRouter();
  const [saju, setSaju] = useState<SajuResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    apiFetch<SajuResponse>("/saju/me")
      .then(setSaju)
      .catch((e: Error) => setError(e.message));
  }, [router]);

  return (
    <AppShell>
      <div className="flex-1 px-[20px]">
        <h1 className="mt-[14px] text-center text-[20px] font-medium text-white">
          내 사주
        </h1>

        {error && (
          <div className="mt-[40px] rounded-[12px] border border-red-400/40 bg-red-500/10 p-4 text-center text-sm text-red-200">
            <p className="font-semibold">사주를 불러오지 못했어요</p>
            <p className="mt-1 text-xs">{error}</p>
            <p className="mt-2 text-xs text-white/50">
              생년월일이 입력되어 있어야 합니다.
            </p>
          </div>
        )}

        {!saju && !error && (
          <div className="flex justify-center pt-[80px]">
            <div className="size-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          </div>
        )}

        {saju && (
          <div className="space-y-[20px] pt-[14px]">
            {/* 오행 밸런스 펜타곤 */}
            <section className="relative rounded-[18px] border border-white/15 bg-white/5 p-[16px] backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-bold text-white">
                  나의 오행 밸런스 <span className="text-white/40">ⓘ</span>
                </h2>
                <button
                  type="button"
                  onClick={() => router.push("/jamidusu")}
                  className="rounded-full bg-white/10 px-[10px] py-[4px] text-[10px] text-white/70 hover:bg-white/20"
                >
                  자미두수 보러가기
                </button>
              </div>
              <div className="mt-[8px] flex justify-center">
                <ElementPentagon profile={saju.element_profile} size={280} />
              </div>
            </section>

            {/* 오행 종합 해석 */}
            <section className="rounded-[14px] border border-white/15 bg-white/5 p-[16px] backdrop-blur-sm">
              <h3 className="text-[14px] font-bold text-white">
                오행 종합 해석 ✨
              </h3>
              <div className="mt-[8px] space-y-[6px] text-[12px] leading-[20px] text-white/80">
                <DominantSummary profile={saju.element_profile} />
                {saju.interpretation && (
                  <p className="border-t border-white/10 pt-[6px]">
                    {saju.interpretation}
                  </p>
                )}
                {saju.interpretation_status === "pending" && (
                  <p className="border-t border-white/10 pt-[6px] text-white/40">
                    원전 데이터 ingest 후 LLM 해석이 표시됩니다.
                  </p>
                )}
              </div>
            </section>

            {/* 사주 4기둥 */}
            <section>
              <h2 className="text-[16px] font-bold text-white">
                나의 사주 구성 <span className="text-white/40">ⓘ</span>
              </h2>
              <div className="mt-[12px] grid grid-cols-4 gap-[8px]">
                {saju.pillars.map((p, i) => (
                  <PillarCard
                    key={p.label}
                    pillar={p}
                    isDay={i === 2 /* 일주(day) is highlighted in design */}
                  />
                ))}
              </div>
            </section>

            {/* 일간 / 강·약 오행 / 보완 색 — derived from saju.pillars + element_profile */}
            <DerivedInfoCards
              pillars={saju.pillars}
              profile={saju.element_profile}
            />


            {/* Birth input echo */}
            <section className="rounded-[12px] border border-white/10 bg-white/5 p-[12px] text-[12px] text-white/60">
              <p>
                계산 입력값:{" "}
                <span className="text-white/80">
                  {saju.input_summary.birth_date}
                  {saju.input_summary.birth_time
                    ? ` ${saju.input_summary.birth_time}`
                    : " (시간 모름)"}
                  {" / "}
                  {saju.input_summary.calendar_type === "solar" ? "양력" : "음력"}
                  {saju.input_summary.is_leap_month ? " (윤달)" : ""}
                </span>
              </p>
              <p className="mt-1 text-white/40">
                ※ 현재 사주 계산은 placeholder 알고리즘입니다. 정식 60갑자
                엔진은 추후 통합 예정.
              </p>
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function PillarCard({
  pillar,
  isDay,
}: {
  pillar: SajuPillar;
  isDay: boolean;
}) {
  const stemInfo = STEM_HANJA[pillar.stem];
  const branchInfo = BRANCH_DATA[pillar.branch];
  const stemColor = stemInfo
    ? ELEMENT_DISPLAY[stemInfo.element].color
    : "#ffffff";

  return (
    <div
      className={`relative rounded-[12px] border p-[10px] text-center backdrop-blur-sm ${
        isDay
          ? "border-purple-400/60 bg-purple-500/15 shadow-[0_0_20px_-5px_rgba(168,85,247,0.5)]"
          : "border-white/15 bg-white/5"
      }`}
    >
      <p className="text-[11px] font-medium text-white/70">{pillar.label}</p>
      <div className="mt-[6px]">
        <p
          className="text-[20px] font-bold leading-none"
          style={{ color: stemColor }}
        >
          {stemInfo?.hanja ?? pillar.stem}
          {branchInfo?.hanja ?? pillar.branch}
        </p>
        <p className="mt-[2px] text-[10px] text-white/60">
          {pillar.combined}
          {stemInfo && branchInfo
            ? `(${stemInfo.hanja}${branchInfo.hanja})`
            : ""}
        </p>
      </div>
      {branchInfo && (
        <p className="mt-[4px] text-[10px] text-white/50">
          {branchInfo.animal}
        </p>
      )}
    </div>
  );
}

function InfoCard({
  title,
  subtitle,
  hanja,
  hanjaColor,
}: {
  title: string;
  subtitle: string;
  hanja: string;
  hanjaColor?: string;
}) {
  return (
    <div className="rounded-[12px] border border-white/10 bg-white/5 p-[10px] text-center">
      <p className="text-[11px] font-semibold text-white">{title}</p>
      <p
        className="mt-[6px] text-[14px] font-bold"
        style={{ color: hanjaColor ?? "#d8b4fe" }}
      >
        {hanja}
      </p>
      <p className="mt-[4px] text-[10px] text-white/60 leading-[14px]">
        {subtitle}
      </p>
    </div>
  );
}

/**
 * The four small cards under "사주 구성" — every value derived from the
 * actual SajuResponse so each user sees their own figures.
 */
function DerivedInfoCards({
  pillars,
  profile,
}: {
  pillars: SajuPillar[];
  profile: ElementProfile;
}) {
  // 일간 = day pillar's heavenly stem
  const dayStem = pillars[2]?.stem ?? "";
  const dayInfo = STEM_HANJA[dayStem];
  const dayElement = dayInfo ? ELEMENT_DISPLAY[dayInfo.element] : null;

  const strong = dominantElement(profile);
  const weak = weakestElement(profile);
  const recommended = RECOMMENDED_COLOR[weak];

  const strongDisp = ELEMENT_DISPLAY[strong];
  const weakDisp = ELEMENT_DISPLAY[weak];

  return (
    <section className="grid grid-cols-4 gap-[8px]">
      <InfoCard
        title="일간(나)"
        hanja={
          dayInfo && dayElement ? `${dayInfo.hanja}${dayElement.hanja}` : "—"
        }
        subtitle={STEM_DESCRIPTION[dayStem] ?? "—"}
        hanjaColor={dayElement?.color}
      />
      <InfoCard
        title="강한 오행"
        hanja={`${strongDisp.ko}(${strongDisp.hanja})`}
        subtitle={`${profile[strong]}점 — 가장 강함`}
        hanjaColor={strongDisp.color}
      />
      <InfoCard
        title="약한 오행"
        hanja={`${weakDisp.ko}(${weakDisp.hanja})`}
        subtitle={`${profile[weak]}점 — 보완 필요`}
        hanjaColor={weakDisp.color}
      />
      <InfoCard
        title="추천 색"
        hanja={recommended.name}
        subtitle={`${weakDisp.ko}의 기운을 보완`}
        hanjaColor={recommended.hex}
      />
    </section>
  );
}

function DominantSummary({
  profile,
}: {
  profile: import("@/lib/saju").ElementProfile;
}) {
  const dom = dominantElement(profile);
  const display = ELEMENT_DISPLAY[dom];
  return (
    <p>
      <span style={{ color: display.color }} className="font-semibold">
        {display.ko}({display.hanja})
      </span>
      의 기운이 가장 강합니다. 자유롭고 유연한 성향을 지니며, 균형을 위해
      반대 기운을 보완해 보세요.
    </p>
  );
}