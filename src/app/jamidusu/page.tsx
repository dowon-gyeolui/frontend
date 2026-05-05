"use client";

import { ArrowLeft, HeartHandshake, Lock, Sparkles, Star as StarIcon, User as UserIcon, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { LoadingPanel } from "@/components/ui/loading-panel";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { CACHE_TTL, fetchWithCache } from "@/lib/cache";

type Me = {
  id: number;
  nickname: string | null;
  is_paid: boolean;
};

/**
 * 자미두수 (Jami-dusu / Zǐwēi Dòushù) — premium feature paywall.
 *
 * Real payment integration (PortOne / Toss) is a Phase 2 task; for now this
 * page renders a polished "결제 후 이용 가능" CTA so the demo flow is intact.
 * Once the payment SDK lands, the same button will trigger the PG modal.
 */
export default function JamidusuPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    apiFetch<Me>("/users/me")
      .then(setMe)
      .catch(() => {});
  }, [router]);

  return (
    <AppShell>
      <div className="flex-1 px-[20px]">
        {/* Sub-header: back arrow + title */}
        <div className="relative pt-[14px]">
          <button
            type="button"
            onClick={() => router.push("/saju")}
            aria-label="뒤로"
            className="absolute left-0 top-[14px]"
          >
            <ArrowLeft className="size-[24px] stroke-white stroke-[2]" />
          </button>
          <h1 className="text-center text-[20px] font-bold text-white">
            자미두수
          </h1>
          <div className="mt-[10px] h-px bg-white/30" />
        </div>

        {me?.is_paid ? <PaidView nickname={me.nickname} /> : <Paywall onUpgrade={() => router.push("/premium?from=jamidusu")} />}
      </div>
    </AppShell>
  );
}

/* ── Paid view — actual 사주+자미두수 deep 풀이 ── */

type DeepStar = {
  name: string;          // 한자명 (UI 에 직접 노출 X)
  name_ko: string;       // 한글 — "황제의 별"
  type: "main" | "lucky" | "unlucky" | "transform";
  sub: string | null;    // 사화 라벨 붙은 본주성 이름
};

type DeepPalace = {
  name: string;          // "命宮"
  name_ko: string;       // "명궁"
  branch: string;
  branch_ko: string;
  stem: string;
  stem_ko: string;
  stars: DeepStar[];
  description: string;   // LLM 풀이
};

type DeepResponse = {
  user_id: number;
  interpretation_status: "pending" | "ready" | "partial";
  bureau_name: string;       // "水二局"
  year_pillar: string;       // "乙亥"
  lunar_birth: string | null;
  hour_assumed: boolean;
  headline: string;
  overview: string;
  sections: {
    personality: string;
    love: string;
    wealth: string;
    advice: string;
  };
  palaces: DeepPalace[];
  main_stars_summary: string;
  sources: string[];
};

const STAR_TYPE_STYLES: Record<DeepStar["type"], string> = {
  main: "bg-[#fde047]/20 text-[#fde047] border-[#fde047]/40",
  lucky: "bg-emerald-400/15 text-emerald-200 border-emerald-400/30",
  unlucky: "bg-red-400/15 text-red-200 border-red-400/30",
  transform: "bg-pink-400/20 text-pink-200 border-pink-400/40",
};

function PaidView({ nickname }: { nickname: string | null }) {
  const [data, setData] = useState<DeepResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 사주+자미두수 deep 풀이 — gpt-4o 콜이라 ~10초. 캐시 필수.
    fetchWithCache<DeepResponse>(
      "/saju/me/jamidusu-deep",
      CACHE_TTL.saju,
      setData,
      { onError: (e: Error) => setError(e.message) },
    );
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="mt-[24px] rounded-[18px] border border-purple-300/30 bg-gradient-to-br from-purple-900/40 via-purple-700/30 to-pink-700/30 p-[20px] backdrop-blur-sm">
        <div className="flex items-center justify-center">
          <div className="grid size-[64px] place-items-center rounded-full bg-gradient-to-br from-yellow-300 to-pink-400 shadow-[0_0_25px_-5px_rgba(253,224,71,0.6)]">
            <Sparkles className="size-[32px] fill-white stroke-white" />
          </div>
        </div>
        <h2 className="mt-[14px] text-center text-[22px] font-bold text-white">
          {nickname ?? "나"}님의 사주 × 자미두수
        </h2>
        {data && data.bureau_name && (
          <p className="mt-[8px] text-center text-[12px] text-white/65">
            {data.year_pillar}년주 · {data.bureau_name}
            {data.lunar_birth && ` · 음력 ${data.lunar_birth}`}
          </p>
        )}
        {data?.hour_assumed && (
          <p className="mt-[6px] text-center text-[10px] text-yellow-200/80">
            ※ 출생 시간 미입력 — 자시(子時) 가정. 시간 입력하시면 더 정확해져요.
          </p>
        )}
      </section>

      {/* Loading — depth-enhanced prompt 로 응답 더 길어져 14s 정도 추정 */}
      {!data && !error && (
        <LoadingPanel
          className="mt-[24px]"
          emoji="🔮"
          estimatedMs={14000}
          done={!!data}
          messages={[
            { atPct: 0, text: "12궁 명반(命盤) 계산 중..." },
            { atPct: 18, text: "사주 일간을 자미두수 별과 매칭하고 있어요" },
            { atPct: 35, text: "자미두수전서 원전 구절 가져오는 중..." },
            { atPct: 55, text: "별 의미와 사주 영향을 엮어 풀어내는 중..." },
            { atPct: 78, text: "12궁 사이의 연결을 다듬는 중..." },
            { atPct: 90, text: "마지막 정리 중... 거의 다 왔어요!" },
          ]}
        />
      )}

      {/* Error */}
      {error && (
        <section className="mt-[24px] rounded-[14px] border border-red-400/40 bg-red-500/10 p-[16px] text-center text-[12px] text-red-200">
          풀이를 불러오지 못했어요. {error}
        </section>
      )}

      {/* Ready or Partial */}
      {data && (data.interpretation_status === "ready" || data.interpretation_status === "partial") && (
        <>
          {/* Headline */}
          {data.headline && (
            <section className="mt-[20px] rounded-[14px] border border-yellow-300/30 bg-gradient-to-br from-yellow-300/10 to-pink-400/10 p-[16px]">
              <p className="text-center text-[15px] font-bold leading-[22px] text-white text-ko">
                “{data.headline}”
              </p>
            </section>
          )}

          {/* Overview */}
          {data.overview && (
            <section className="mt-[14px] rounded-[14px] border border-white/15 bg-white/5 p-[16px]">
              <h3 className="flex items-center gap-[6px] text-[14px] font-bold text-white">
                <Sparkles className="size-[14px] fill-yellow-300 stroke-yellow-300" />
                종합 풀이
              </h3>
              <p className="mt-[8px] whitespace-pre-line text-[13px] leading-[22px] text-white/85 text-ko">
                {data.overview}
              </p>
            </section>
          )}

          {/* 4 sections — 연애 관점 사주+자미두수 융합 */}
          {(data.sections?.personality ||
            data.sections?.love ||
            data.sections?.wealth ||
            data.sections?.advice) && (
            <section className="mt-[14px] space-y-[10px]">
              <h3 className="text-[14px] font-bold text-white">연애 관점 풀이</h3>
              {data.sections.personality && (
                <SectionCard
                  icon={<UserIcon className="size-[18px] stroke-purple-300" />}
                  title="연애 스타일 · 매력"
                  content={data.sections.personality}
                />
              )}
              {data.sections.love && (
                <SectionCard
                  icon={<HeartHandshake className="size-[18px] stroke-pink-300" />}
                  title="이상형 · 끌리는 인연"
                  content={data.sections.love}
                />
              )}
              {data.sections.wealth && (
                <SectionCard
                  icon={<Wallet className="size-[18px] stroke-yellow-300" />}
                  title="데이트 자금 · 안정감"
                  content={data.sections.wealth}
                />
              )}
              {data.sections.advice && (
                <SectionCard
                  icon={<Sparkles className="size-[18px] stroke-emerald-300" />}
                  title="좋은 인연을 위한 제안"
                  content={data.sections.advice}
                  highlight
                />
              )}
            </section>
          )}

          {/* 12궁 명반 + 풀이 */}
          {data.palaces.length > 0 && (
            <section className="mt-[16px] space-y-[10px]">
              <h3 className="text-[14px] font-bold text-white">
                12궁 명반(命盤)
              </h3>
              {data.palaces.map((p) => (
                <PalaceCard key={p.name} palace={p} />
              ))}
            </section>
          )}

          {/* 14주성 종합 */}
          {data.main_stars_summary && (
            <section className="mt-[16px] rounded-[14px] border border-white/15 bg-white/5 p-[16px]">
              <h3 className="flex items-center gap-[6px] text-[14px] font-bold text-white">
                <StarIcon className="size-[14px] fill-yellow-300 stroke-yellow-300" />
                14주성 종합
              </h3>
              <p className="mt-[8px] whitespace-pre-line text-[13px] leading-[22px] text-white/85 text-ko">
                {data.main_stars_summary}
              </p>
            </section>
          )}

          {/* Partial — 차트는 있지만 LLM 실패 */}
          {data.interpretation_status === "partial" && (
            <section className="mt-[16px] rounded-[14px] border border-yellow-400/30 bg-yellow-500/5 p-[14px] text-center">
              <p className="text-[12px] leading-[20px] text-yellow-100/80">
                12궁 명반은 정상 계산됐지만 LLM 풀이를 일시적으로 가져오지 못했어요.
                <br />
                잠시 후 새로고침 해주세요.
              </p>
            </section>
          )}

          {/* Sources */}
          {data.sources.length > 0 && (
            <section className="mt-[16px] rounded-[12px] border border-white/10 bg-white/5 p-[12px]">
              <p className="text-[11px] font-semibold text-white/70">📚 참고 원전</p>
              <ul className="mt-[6px] space-y-[3px] text-[11px] text-white/50">
                {data.sources.map((src) => (
                  <li key={src} className="leading-[16px]">
                    {src}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {/* Pending (LLM 완전 실패 + 차트도 없음) */}
      {data && data.interpretation_status === "pending" && (
        <section className="mt-[20px] rounded-[14px] border border-white/15 bg-white/5 p-[16px] text-center">
          <p className="text-[13px] leading-[22px] text-white/75">
            자미두수 풀이를 만들지 못했어요. 사주 정보를 확인해주시거나 잠시 후 새로 고침 해주세요.
          </p>
        </section>
      )}

      <p className="mt-[20px] text-center text-[10px] text-white/40">
        ※ 12궁×별 배치는 표준 안성술(安星術) 로 결정론적 계산. 풀이는 LLM 보조 결과로
        가벼운 참고용으로 활용해주세요.
      </p>
    </>
  );
}

/* ── 12궁 카드 ── */
function PalaceCard({ palace }: { palace: DeepPalace }) {
  return (
    <div className="rounded-[14px] border border-white/15 bg-white/5 p-[14px]">
      <div className="flex items-baseline justify-between">
        <h4 className="text-[15px] font-bold text-white">
          {palace.name_ko}
          <span className="ml-[6px] text-[11px] font-normal text-white/50">
            {palace.stem_ko}
            {palace.branch_ko}
          </span>
        </h4>
      </div>

      {palace.stars.length > 0 && (
        <div className="mt-[8px] flex flex-wrap gap-[5px]">
          {palace.stars.map((s, i) => (
            <span
              key={`${s.name}-${i}`}
              className={`rounded-full border px-[8px] py-[2px] text-[10px] font-medium ${STAR_TYPE_STYLES[s.type]}`}
            >
              {s.name_ko}
            </span>
          ))}
        </div>
      )}

      {palace.description && (
        <p className="mt-[10px] text-[12px] leading-[19px] text-white/80 text-ko">
          {palace.description}
        </p>
      )}
    </div>
  );
}

/* ── 4 섹션 카드 ── */
function SectionCard({
  icon,
  title,
  content,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  content: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[14px] border p-[14px] ${
        highlight
          ? "border-yellow-300/40 bg-gradient-to-br from-yellow-300/10 to-pink-400/10"
          : "border-white/15 bg-white/5"
      }`}
    >
      <div className="flex items-center gap-[8px]">
        {icon}
        <h4 className="text-[14px] font-bold text-white">{title}</h4>
      </div>
      <p className="mt-[8px] whitespace-pre-line text-[13px] leading-[20px] text-white/85 text-ko">
        {content}
      </p>
    </div>
  );
}

/* ── Paywall — locked teaser + 결제 CTA ── */
function Paywall({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <>
      <section className="mt-[24px] rounded-[18px] border border-purple-300/30 bg-gradient-to-br from-purple-900/40 via-purple-700/30 to-pink-700/30 p-[20px] backdrop-blur-sm">
        <div className="flex items-center justify-center">
          <div className="grid size-[64px] place-items-center rounded-full bg-gradient-to-br from-yellow-300 to-pink-400 shadow-[0_0_25px_-5px_rgba(253,224,71,0.6)]">
            <Sparkles className="size-[32px] fill-white stroke-white" />
          </div>
        </div>
        <h2 className="mt-[14px] text-center text-[22px] font-bold text-white">
          나의 사주 × 자미두수
        </h2>
        <p className="mt-[10px] text-center text-[13px] leading-[20px] text-white/80">
          1000년 전통 자미두수 명반(命盤)을
          <br />
          정확하게 계산하고, 사주 일간과 교차한
          <br />
          연애 관점 풀이를 받아보세요.
        </p>
      </section>

      <section className="mt-[24px]">
        <h3 className="text-[16px] font-bold text-white">사주 × 자미두수로 알 수 있는 것</h3>
        <ul className="mt-[12px] space-y-[10px] text-[14px] text-white/85">
          <li className="flex gap-[10px]">
            <span className="text-[#fde047]">✦</span>
            <span>
              <span className="font-semibold">12궁 × 14주성</span> — 명궁부터 부모궁까지,
              실제 별 배치까지 결정론적으로 계산
            </span>
          </li>
          <li className="flex gap-[10px]">
            <span className="text-[#fde047]">✦</span>
            <span>
              <span className="font-semibold">사주 × 자미두수 교차</span> — 일간이 별·궁의
              성향에 어떻게 영향을 주는지
            </span>
          </li>
          <li className="flex gap-[10px]">
            <span className="text-[#fde047]">✦</span>
            <span>
              <span className="font-semibold">사화(四化)·부성</span> — 化祿/化權/化科/化忌 +
              좌보/우필 등 28개 별 모두 적용
            </span>
          </li>
          <li className="flex gap-[10px]">
            <span className="text-[#fde047]">✦</span>
            <span>
              <span className="font-semibold">연애 4섹션</span> — 매력·이상형·자금감각·제안
            </span>
          </li>
        </ul>
      </section>

      <section className="mt-[28px] rounded-[18px] border-2 border-yellow-300/50 bg-gradient-to-br from-yellow-300/10 to-pink-400/10 p-[20px] text-center">
        <p className="text-[12px] font-medium uppercase tracking-wider text-[#fde047]">
          premium
        </p>
        <p className="mt-[6px] text-[28px] font-bold text-white">9,900원</p>
        <p className="mt-[4px] text-[12px] text-white/60">1회 결제 · 평생 열람</p>

        <button
          type="button"
          onClick={onUpgrade}
          className="mt-[18px] flex h-[52px] w-full items-center justify-center gap-[8px] rounded-[12px] bg-gradient-to-r from-yellow-300 to-pink-400 text-[16px] font-bold text-[#1b1029] hover:opacity-90"
        >
          <Lock className="size-[16px]" />
          프리미엄 가입하고 풀이 받기 →
        </button>
        <p className="mt-[10px] text-[11px] text-white/50">
          ZAMI 프리미엄 9,900원 / 월
        </p>
      </section>

      <p className="mt-[20px] text-center text-[10px] text-white/40">
        ※ 자미두수 명반은 표준 안성술로 정확 계산. 풀이는 LLM 보조 결과예요.
      </p>
    </>
  );
}