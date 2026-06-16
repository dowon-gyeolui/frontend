"use client";

import { Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { ElementPentagon } from "@/components/saju/element-pentagon";
import { LoadingPanel } from "@/components/ui/loading-panel";
import { getToken } from "@/lib/auth";
import { CACHE_TTL, fetchWithCache } from "@/lib/cache";
import {
  ELEMENT_DISPLAY,
  dominantElement,
  type SajuResponse,
} from "@/lib/saju";

/** SajuResponse + the 4 narrative sections from /saju/me/detailed. */
type DetailedSajuResponse = SajuResponse & {
  personality: string;
  love: string;
  wealth: string;
  advice: string;
};

export default function SajuPage() {
  const router = useRouter();
  const [saju, setSaju] = useState<DetailedSajuResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    // /saju/me/detailed is the LLM-backed endpoint (5–10s on cold call).
    // Cache + revalidate so returning users see their saju immediately.
    fetchWithCache<DetailedSajuResponse>(
      "/saju/me/detailed",
      CACHE_TTL.saju,
      setSaju,
      { onError: (e) => setError(e.message) },
    );
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

        {/* Loading state — same idiom as home's 행동 가이드 spinner so the
            user gets the same "loading is happening" cue across screens.
            /saju/me/detailed is LLM-backed (~5–10s cold call), so silent
            spinning made the page look frozen. */}
        {!saju && !error && (
          <div className="pt-[60px]">
            <LoadingPanel
              estimatedMs={8000}
              done={!!saju}
              messages={[
                { atPct: 0, text: "사주 보는 중..." },
                { atPct: 25, text: "사주 분석 중..." },
                { atPct: 50, text: "책 구절을 찾아보는 중..." },
                { atPct: 75, text: "풀이 작성 중..." },
                { atPct: 90, text: "거의 다 했어요!" },
              ]}
            />
          </div>
        )}

        {saju && (
          <div className="space-y-[20px] pt-[14px]">
            {/* 나의 사주 풀이 — 상단으로 (LLM 해석이 먼저 보이도록) */}
            <NarrativeSections data={saju} />

            {/* 나의 사주 구성 — 펜타곤 + 종합 해석 + 명식 (구조적 정보는 하단으로) */}
            <section className="relative rounded-[18px] border border-white/15 bg-white/5 p-[16px] backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-bold text-white">
                  나의 오행 밸런스
                </h2>
              </div>
              <div className="mt-[8px] flex justify-center">
                <ElementPentagon profile={saju.element_profile} size={280} />
              </div>
            </section>

            {/* 오행 종합 해석 */}
            <section className="rounded-[14px] border border-white/15 bg-white/5 p-[16px] backdrop-blur-sm">
              <h3 className="text-[14px] font-bold text-white">
                종합 해석
              </h3>
              <div className="mt-[8px] space-y-[6px] text-[12px] leading-[20px] text-white/80 text-ko">
                <DominantSummary profile={saju.element_profile} />
                {saju.interpretation && (
                  <p className="border-t border-white/10 pt-[6px]">
                    {saju.interpretation}
                  </p>
                )}
              </div>
            </section>

            {/* 자미두수 풀이 — 버튼만. 본문은 /jamidusu 안에서 결제 후에만 노출 */}
            <JamidusuCta onOpen={() => router.push("/jamidusu")} />
          </div>
        )}
      </div>
    </AppShell>
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

/* ── Narrative interpretation cards (inlined from the old /saju/detail) ── */

function NarrativeSections({ data }: { data: DetailedSajuResponse }) {
  const [showSources, setShowSources] = useState(false);

  // RAG retrieval found nothing → render a polite explainer instead of
  // 4 empty cards.
  if (data.interpretation_status === "pending") {
    return (
      <section className="rounded-[14px] border border-yellow-400/30 bg-yellow-500/5 p-[14px] text-center">
        <p className="text-[13px] leading-[20px] text-yellow-100/80">
          심층 해석에 어려움을 겪고 있어요.
          <br />
          생년월일/시간을 더 정확히 입력하면 풀이가 향상됩니다.
        </p>
      </section>
    );
  }
  const hasSources = data.interpretation_sources.length > 0;
  return (
    <section className="space-y-[12px]">
      <h2 className="flex items-center gap-[6px] text-[16px] font-bold text-white">
        나의 사주 풀이
        {hasSources && (
          <button
            type="button"
            onClick={() => setShowSources((v) => !v)}
            aria-label={showSources ? "참고 원전 숨기기" : "참고 원전 보기"}
            className={`grid size-[20px] place-items-center rounded-full border transition ${
              showSources
                ? "border-[#fde047]/60 bg-[#fde047]/15 text-[#fde047]"
                : "border-white/30 text-white/60 hover:border-white/60 hover:text-white/85"
            }`}
          >
            <Info className="size-[12px]" />
          </button>
        )}
      </h2>
      <NarrativeCard
        title="성격"
        content={data.personality}
      />
      <NarrativeCard
        title="대인관계 · 연애운"
        content={data.love}
      />
      <NarrativeCard
        title="재물운"
        content={data.wealth}
      />
      <NarrativeCard
        title="조언"
        content={data.advice}
        highlight
      />
      {hasSources && showSources && (
        <div className="rounded-[12px] border border-white/15 bg-white/5 p-[12px]">
          <p className="text-[11px] font-semibold text-white/70">참고 원전</p>
          <ul className="mt-[6px] space-y-[3px] text-[11px] text-white/50">
            {data.interpretation_sources.map((src) => (
              <li key={src} className="leading-[16px]">{src}</li>
            ))}
          </ul>
          <p className="mt-[8px] text-[10px] leading-[15px] text-white/40">
            사주 구절들을 기반으로 저희가 만들어봤어요.
          </p>
        </div>
      )}
    </section>
  );
}

function NarrativeCard({
  title,
  content,
  highlight,
}: {
  title: string;
  content: string;
  highlight?: boolean;
}) {
  const has = content.trim().length > 0;
  return (
    <div
      className={`rounded-[14px] border p-[14px] backdrop-blur-sm ${
        highlight
          ? "border-yellow-300/40 bg-gradient-to-br from-yellow-300/10 to-pink-400/10"
          : "border-white/15 bg-white/5"
      }`}
    >
      <h3 className="text-[15px] font-bold text-white">{title}</h3>
      <p className="mt-[8px] text-[13px] leading-[20px] text-white/85 text-ko">
        {has ? content : (
          <span className="text-white/40">
            이 항목에 대해서 찾지 못했어요.
          </span>
        )}
      </p>
    </div>
  );
}

/* ── 자미두수 풀이 CTA ──
 * 버튼만 노출. 탭하면 /jamidusu 로 이동해 결제 후 본문을 본다.
 */

function JamidusuCta({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-[46px] w-full items-center justify-center rounded-[10px] bg-gradient-to-r from-yellow-300 to-pink-400 text-[14px] font-bold text-[#1b1029] shadow-[0_0_15px_-2px_rgba(253,224,71,0.5)] hover:opacity-90"
    >
      자미두수 풀이 보러가기
    </button>
  );
}