"use client";

import { ArrowLeft, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
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

/* ── Paid view — actual 자미두수 풀이 ── */

type JamidusuPalace = { name: string; description: string };
type JamidusuResponse = {
  user_id: number;
  overview: string;
  palaces: JamidusuPalace[];
  main_stars_summary: string;
  interpretation_status: "pending" | "ready";
};

function PaidView({ nickname }: { nickname: string | null }) {
  const [data, setData] = useState<JamidusuResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 자미두수 풀이는 LLM 호출 (5–10초). 캐시해서 재방문 시 즉시 표시.
    fetchWithCache<JamidusuResponse>(
      "/saju/me/jamidusu",
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
          {nickname ?? "나"}님의 자미두수
        </h2>
        <p className="mt-[8px] text-center text-[12px] text-white/60">
          12궁 · 14주성 · 대운 풀이
        </p>
      </section>

      {/* Loading state */}
      {!data && !error && (
        <section className="mt-[24px] rounded-[14px] border border-white/15 bg-white/5 p-[20px] text-center">
          <div className="mx-auto size-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="mt-[10px] text-[12px] text-white/60">
            자미두수를 풀이하고 있어요... 5~10초 정도 걸려요
          </p>
        </section>
      )}

      {/* Error state */}
      {error && (
        <section className="mt-[24px] rounded-[14px] border border-red-400/40 bg-red-500/10 p-[16px] text-center text-[12px] text-red-200">
          풀이를 불러오지 못했어요. {error}
        </section>
      )}

      {/* LLM ready */}
      {data && data.interpretation_status === "ready" && (
        <>
          {/* 종합 요약 */}
          {data.overview && (
            <section className="mt-[20px] rounded-[14px] border border-yellow-300/30 bg-gradient-to-br from-yellow-300/10 to-pink-400/10 p-[16px]">
              <h3 className="flex items-center gap-[6px] text-[14px] font-bold text-white">
                <Sparkles className="size-[14px] fill-yellow-300 stroke-yellow-300" />
                종합 풀이
              </h3>
              <p className="mt-[8px] whitespace-pre-line text-[13px] leading-[22px] text-white/85">
                {data.overview}
              </p>
            </section>
          )}

          {/* 12궁 */}
          {data.palaces.length > 0 && (
            <section className="mt-[16px] rounded-[14px] border border-white/15 bg-white/5 p-[16px]">
              <h3 className="text-[14px] font-bold text-white">12궁 풀이</h3>
              <ul className="mt-[10px] space-y-[10px] text-[13px] leading-[20px] text-white/85">
                {data.palaces.map((p) => (
                  <li key={p.name}>
                    <span className="font-semibold text-white">{p.name}</span>
                    <br />
                    <span className="text-white/75">{p.description}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 14주성 요약 */}
          {data.main_stars_summary && (
            <section className="mt-[16px] rounded-[14px] border border-white/15 bg-white/5 p-[16px]">
              <h3 className="text-[14px] font-bold text-white">14주성 요약</h3>
              <p className="mt-[8px] whitespace-pre-line text-[13px] leading-[22px] text-white/85">
                {data.main_stars_summary}
              </p>
            </section>
          )}
        </>
      )}

      {/* LLM pending — happens when OpenAI quota is hit or API key missing */}
      {data && data.interpretation_status === "pending" && (
        <section className="mt-[20px] rounded-[14px] border border-white/15 bg-white/5 p-[16px] text-center">
          <p className="text-[13px] leading-[22px] text-white/75">
            자미두수 LLM 풀이를 일시적으로 불러올 수 없어요. 잠시 후 새로 고침 해주세요.
          </p>
        </section>
      )}

      <p className="mt-[20px] text-center text-[10px] text-white/40">
        ※ 자미두수 풀이는 LLM 보조 서비스로, 보조 참고 자료로만 활용해주세요.
      </p>
    </>
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
          나의 자미두수
        </h2>
        <p className="mt-[10px] text-center text-[13px] leading-[20px] text-white/80">
          중국 송나라에서 시작된 1000년의 전통 점성술.
          <br />
          태어난 시각의 별자리(命宮)를 통해
          <br />
          평생의 운명·재물·연애를 풀어드립니다.
        </p>
      </section>

      <section className="mt-[24px]">
        <h3 className="text-[16px] font-bold text-white">자미두수로 알 수 있는 것</h3>
        <ul className="mt-[12px] space-y-[10px] text-[14px] text-white/85">
          <li className="flex gap-[10px]">
            <span className="text-[#fde047]">✦</span>
            <span><span className="font-semibold">12궁 분석</span> — 명궁부터 부모궁까지 인생 전 영역</span>
          </li>
          <li className="flex gap-[10px]">
            <span className="text-[#fde047]">✦</span>
            <span><span className="font-semibold">14주성 배치</span> — 자미·천기·태양 등 주성의 위치로 본 운명</span>
          </li>
          <li className="flex gap-[10px]">
            <span className="text-[#fde047]">✦</span>
            <span><span className="font-semibold">대운·세운</span> — 10년 단위 대운과 올해의 흐름</span>
          </li>
          <li className="flex gap-[10px]">
            <span className="text-[#fde047]">✦</span>
            <span><span className="font-semibold">사주와의 비교</span> — 두 학문이 알려주는 같은 점·다른 점</span>
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
          className="mt-[18px] h-[52px] w-full rounded-[12px] bg-gradient-to-r from-yellow-300 to-pink-400 text-[16px] font-bold text-[#1b1029] hover:opacity-90"
        >
          프리미엄 가입하고 풀이 받기 →
        </button>
        <p className="mt-[10px] text-[11px] text-white/50">
          ZAMI 프리미엄 9,900원 / 월
        </p>
      </section>

      <p className="mt-[20px] text-center text-[10px] text-white/40">
        ※ 자미두수 계산 엔진은 정식 출시 전 베타 테스트 중입니다.
      </p>
    </>
  );
}