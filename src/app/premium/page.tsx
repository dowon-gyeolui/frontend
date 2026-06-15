"use client";

import { ArrowLeft, MessageCircle, Sparkles, Star } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";

/**
 * 스타·인연 카드 안내 업셀 화면.
 *
 * 수익모델이 월구독에서 "스타 재화로 인연 카드 열람"(PRD 5번) 으로 바뀌어,
 * 이 화면은 구독 결제 대신 스타 충전(/store) 으로 유도한다.
 *
 * 진입점별로 카피가 살짝 달라진다:
 *   /premium?from=chat       — 채팅을 시작하려다 들어온 경우
 *   /premium?from=jamidusu   — 자미두수에서 들어온 경우
 */
function PremiumContent() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from"); // "chat" | "jamidusu" | null

  const HeroIcon = from === "chat" ? MessageCircle : Star;

  const heroTitle =
    from === "chat"
      ? "마음에 드는 인연과 대화를 시작해보세요"
      : "별로 더 많은 인연을 만나보세요";

  const heroSubtitle =
    from === "chat"
      ? "인연 카드를 열람하면 그 상대와 바로 채팅할 수 있어요."
      : "오늘의 인연은 매일 무료 1장. 더 만나고 싶다면 별로 추가 인연 카드를 열어보세요.";

  return (
    <AppShell>
      <div className="flex-1 px-[20px] pb-[40px]">
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
            ZAMI 별
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
          <h2 className="mt-[14px] text-[20px] font-bold text-white">{heroTitle}</h2>
          <p className="mt-[10px] text-[13px] leading-[20px] text-white/80">
            {heroSubtitle}
          </p>
        </section>

        {/* 스타 사용처 */}
        <section className="mt-[24px]">
          <h3 className="text-[16px] font-bold text-white">별로 할 수 있는 것</h3>
          <ul className="mt-[12px] space-y-[12px] text-[14px] text-white/85">
            <FeatureRow
              icon={<Star className="size-[18px] fill-yellow-300 stroke-yellow-300" />}
              title="추가 인연 카드 열람"
              desc="별 10개로 인연 카드 1장 · 하루 최대 10장까지"
            />
            <FeatureRow
              icon={<MessageCircle className="size-[18px] stroke-purple-300" />}
              title="열람한 상대와 바로 채팅"
              desc="카드를 연 상대에게는 먼저 인사를 건넬 수 있어요"
            />
            <FeatureRow
              icon={<Sparkles className="size-[18px] fill-pink-300 stroke-pink-300" />}
              title="매일 무료 1장은 그대로"
              desc="오늘의 인연 카드는 매일 무료로 받아요"
            />
          </ul>
        </section>

        {/* 충전 CTA */}
        <section className="mt-[28px] rounded-[18px] border-2 border-yellow-300/50 bg-gradient-to-br from-yellow-300/10 to-pink-400/10 p-[20px] text-center">
          <p className="text-[12px] font-medium uppercase tracking-wider text-[#fde047]">
            ZAMI STAR
          </p>
          <p className="mt-[6px] text-[15px] font-semibold text-white">
            별 10개 = 인연 카드 1장
          </p>
          <p className="mt-[4px] text-[12px] text-white/60">
            1,100원부터
          </p>

          <button
            type="button"
            onClick={() => router.push("/store")}
            className="mt-[18px] flex h-[52px] w-full items-center justify-center gap-[8px] rounded-[12px] bg-gradient-to-r from-yellow-300 to-pink-400 text-[16px] font-bold text-[#1b1029] shadow-[0_0_15px_-3px_rgba(253,224,71,0.6)] hover:opacity-90"
          >
            <Star className="size-[16px] fill-[#1b1029]" />
            별 충전하러 가기
          </button>
        </section>
      </div>
    </AppShell>
  );
}

function FeatureRow({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex items-start gap-[12px] rounded-[12px] p-[10px]">
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
