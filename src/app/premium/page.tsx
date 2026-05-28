"use client";

import { ArrowLeft, MessageCircle, Sparkles, Star } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";

/**
 * Premium upsell — covers all paid features in one place.
 *
 * Two entry points so far:
 *   /premium?from=chat       — bounced from a chat room (free user blocked)
 *   /premium?from=jamidusu   — clicked "자미두수 보러가기"
 *
 * The hero copy and CTA wording adapt to `from` so the prompt feels
 * specific to what the user just tried to do.
 */
function PremiumContent() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from"); // "chat" | "jamidusu" | null

  const heroIcon =
    from === "chat" ? MessageCircle : from === "jamidusu" ? Star : Sparkles;
  const HeroIcon = heroIcon;

  const heroTitle =
    from === "chat"
      ? "프리미엄 가입 후 채팅을 시작하세요"
      : from === "jamidusu"
        ? "프리미엄 회원만 자미두수 풀이를 받을 수 있어요"
        : "ZAMI 프리미엄 — 운명의 인연을 만나는 모든 도구";

  const heroSubtitle =
    from === "chat"
      ? "사주 궁합으로 만난 인연과 자유롭게 대화하고, 운명의 흐름을 함께 만들어가세요."
      : from === "jamidusu"
        ? "1000년의 전통 점성술 자미두수로 평생 운명을 풀어드립니다."
        : "채팅·자미두수·심층 풀이를 모두 한 번에.";

  return (
    <AppShell>
      <div className="flex-1 px-[20px]">
        {/* Sub-header: back arrow + title */}
        <div className="relative pt-[14px]">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="뒤로"
            className="absolute left-0 top-[14px]"
          >
            <ArrowLeft className="size-[24px] stroke-white stroke-[2]" />
          </button>
          <h1 className="text-center text-[20px] font-bold text-white">
            ZAMI 프리미엄
          </h1>
          <div className="mt-[10px] h-px bg-white/30" />
        </div>

        {/* Hero */}
        <section className="mt-[24px] rounded-[18px] border border-yellow-300/40 bg-gradient-to-br from-purple-900/40 via-purple-700/30 to-pink-700/30 p-[20px] text-center backdrop-blur-sm">
          <div className="flex justify-center">
            <div className="grid size-[64px] place-items-center rounded-full bg-gradient-to-br from-yellow-300 to-pink-400 shadow-[0_0_25px_-5px_rgba(253,224,71,0.6)]">
              <HeroIcon className="size-[32px] fill-white stroke-white" />
            </div>
          </div>
          <h2 className="mt-[14px] text-[20px] font-bold text-white">
            {heroTitle}
          </h2>
          <p className="mt-[10px] text-[13px] leading-[20px] text-white/80">
            {heroSubtitle}
          </p>
        </section>

        {/* Feature list */}
        <section className="mt-[24px]">
          <h3 className="text-[16px] font-bold text-white">프리미엄 혜택</h3>
          <ul className="mt-[12px] space-y-[12px] text-[14px] text-white/85">
            <FeatureRow
              highlight={from === "chat"}
              icon={<MessageCircle className="size-[18px] stroke-purple-300" />}
              title="무제한 채팅"
              desc="매칭된 모든 인연과 자유롭게 대화"
            />
            <FeatureRow
              highlight={from === "jamidusu"}
              icon={<Star className="size-[18px] fill-yellow-300 stroke-yellow-300" />}
              title="자미두수 평생 열람"
              desc="12궁·14주성·대운까지 평생 운명 풀이"
            />
            <FeatureRow
              icon={<Sparkles className="size-[18px] fill-pink-300 stroke-pink-300" />}
              title="심층 사주 풀이"
              desc="성격·연애·재물·건강 카테고리별 LLM 해석"
            />
            <FeatureRow
              icon={<Sparkles className="size-[18px] stroke-emerald-300" />}
              title="매일 갱신되는 운세"
              desc="오늘의 인연운, 행동 가이드, 추천 색상"
            />
          </ul>
        </section>

        {/* Pricing */}
        <section className="mt-[28px] rounded-[18px] border-2 border-yellow-300/50 bg-gradient-to-br from-yellow-300/10 to-pink-400/10 p-[20px] text-center">
          <p className="text-[12px] font-medium uppercase tracking-wider text-[#fde047]">
            premium membership
          </p>
          <p className="mt-[6px] text-[28px] font-bold text-white">9,900원</p>
          <p className="mt-[4px] text-[12px] text-white/60">월간 구독 · 언제든 해지</p>

          <button
            type="button"
            disabled
            className="mt-[18px] h-[52px] w-full rounded-[12px] bg-gradient-to-r from-yellow-300 to-pink-400 text-[16px] font-bold text-[#1b1029] opacity-60 disabled:cursor-not-allowed"
          >
            결제 시스템 준비 중
          </button>
          <p className="mt-[10px] text-[11px] text-white/50">
            카카오페이 / 토스 / 카드결제 연동 작업 중입니다.
            <br />
            정식 출시 후 활성화 예정.
          </p>
        </section>

        {/* Demo bypass — present only because we're in pre-launch demo mode */}
        <section className="mt-[16px] rounded-[14px] border border-white/15 bg-white/5 p-[12px]">
          <p className="text-center text-[11px] text-white/60">
            데모 기간에는 모든 사용자가 자동으로 프리미엄 권한을 받습니다.
            <br />
            이 화면이 보이면 결제 시스템 연동 미완료 상태입니다.
          </p>
        </section>

        <p className="mt-[20px] text-center text-[10px] text-white/40">
          ※ 결제 시스템은 PortOne·토스페이먼츠 연동 후 정식 출시됩니다.
        </p>
      </div>
    </AppShell>
  );
}

function FeatureRow({
  icon,
  title,
  desc,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  highlight?: boolean;
}) {
  return (
    <li
      className={`flex items-start gap-[12px] rounded-[12px] p-[10px] ${
        highlight ? "bg-yellow-300/10 ring-1 ring-yellow-300/40" : ""
      }`}
    >
      <div className="mt-[2px]">{icon}</div>
      <div>
        <p className="font-semibold text-white">{title}</p>
        <p className="text-[12px] text-white/65">{desc}</p>
      </div>
    </li>
  );
}

export default function PremiumPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="flex flex-1 items-center justify-center">
            <p className="text-white/60">로딩 중...</p>
          </div>
        </AppShell>
      }
    >
      <PremiumContent />
    </Suspense>
  );
}