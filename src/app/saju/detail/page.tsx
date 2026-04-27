"use client";

import { ArrowLeft, Heart, HeartHandshake, Sparkles, Wallet, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  ELEMENT_DISPLAY,
  STEM_HANJA,
  dominantElement,
  type SajuResponse,
} from "@/lib/saju";

/** Same as SajuResponse + 5 LLM sections. */
type DetailedSajuResponse = SajuResponse & {
  personality: string;
  love: string;
  wealth: string;
  health: string;
  advice: string;
};

export default function SajuDetailPage() {
  const router = useRouter();
  const [data, setData] = useState<DetailedSajuResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    apiFetch<DetailedSajuResponse>("/saju/me/detailed")
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [router]);

  return (
    <AppShell>
      <div className="flex-1 px-[20px]">
        {/* Sub-header */}
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
            나의 사주 풀이
          </h1>
          <div className="mt-[10px] h-px bg-white/30" />
        </div>

        {error && (
          <div className="mt-[40px] rounded-[12px] border border-red-400/40 bg-red-500/10 p-4 text-center text-sm text-red-200">
            <p className="font-semibold">사주를 불러오지 못했어요</p>
            <p className="mt-1 text-xs">{error}</p>
          </div>
        )}

        {!data && !error && (
          <div className="flex flex-col items-center pt-[80px]">
            <div className="size-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
            <p className="mt-[20px] text-[14px] text-white/60">
              심층 사주 풀이를 작성 중입니다...
            </p>
            <p className="mt-[6px] text-[11px] text-white/40">
              5~10초 정도 걸려요 (LLM이 원전을 인용해 작성)
            </p>
          </div>
        )}

        {data && (
          <div className="space-y-[16px] pt-[16px]">
            {/* Top — 일주 + dominant element headline */}
            <SajuHeadline data={data} />

            {/* Pending state if RAG returned nothing */}
            {data.interpretation_status === "pending" ? (
              <div className="rounded-[14px] border border-yellow-400/30 bg-yellow-500/5 p-[16px] text-center">
                <p className="text-[13px] leading-[20px] text-yellow-100/80">
                  원전 데이터가 사주와 매칭되지 않아 심층 해석을 생성하지 못했어요.
                  <br />
                  생년월일/시간을 더 정확히 입력하면 풀이가 향상됩니다.
                </p>
              </div>
            ) : (
              <>
                <SectionCard
                  icon={<UserIcon className="size-[18px] stroke-purple-300" />}
                  title="성격"
                  content={data.personality}
                />
                <SectionCard
                  icon={<HeartHandshake className="size-[18px] stroke-pink-300" />}
                  title="대인관계 · 연애운"
                  content={data.love}
                />
                <SectionCard
                  icon={<Wallet className="size-[18px] stroke-yellow-300" />}
                  title="재물운"
                  content={data.wealth}
                />
                <SectionCard
                  icon={<Heart className="size-[18px] stroke-red-300" />}
                  title="건강"
                  content={data.health}
                />
                <SectionCard
                  icon={<Sparkles className="size-[18px] stroke-emerald-300" />}
                  title="조언"
                  content={data.advice}
                  highlight
                />

                {/* Citations */}
                {data.interpretation_sources.length > 0 && (
                  <div className="rounded-[12px] border border-white/10 bg-white/5 p-[14px]">
                    <p className="text-[11px] font-semibold text-white/70">
                      📚 참고 원전
                    </p>
                    <ul className="mt-[6px] space-y-[3px] text-[11px] text-white/50">
                      {data.interpretation_sources.map((src) => (
                        <li key={src} className="leading-[16px]">
                          {src}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            <p className="pt-[8px] text-center text-[10px] text-white/40">
              ※ LLM이 원전 구절만을 근거로 작성한 해석입니다. 의학·재무 결정에
              사용하지 마세요.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function SajuHeadline({ data }: { data: DetailedSajuResponse }) {
  // 일주 = 3rd pillar (0-indexed 2)
  const dayPillar = data.pillars[2];
  const dayInfo = dayPillar ? STEM_HANJA[dayPillar.stem] : null;
  const dayElement = dayInfo ? ELEMENT_DISPLAY[dayInfo.element] : null;
  const dom = dominantElement(data.element_profile);
  const domDisp = ELEMENT_DISPLAY[dom];

  return (
    <section className="rounded-[18px] border border-white/15 bg-white/5 p-[16px] text-center backdrop-blur-sm">
      <p className="text-[12px] text-white/60">나의 일주</p>
      <p
        className="mt-[6px] text-[28px] font-bold"
        style={{ color: dayElement?.color ?? "#ffffff" }}
      >
        {dayInfo?.hanja ?? dayPillar?.stem ?? "?"}
        {dayPillar?.branch ? `${dayPillar.branch}` : ""}
      </p>
      <p className="mt-[4px] text-[14px] text-white/70">
        주요 오행은{" "}
        <span style={{ color: domDisp.color }} className="font-bold">
          {domDisp.ko}({domDisp.hanja})
        </span>
        입니다
      </p>
    </section>
  );
}

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
  const hasContent = content.trim().length > 0;
  return (
    <section
      className={`rounded-[14px] border p-[16px] backdrop-blur-sm ${
        highlight
          ? "border-yellow-300/40 bg-gradient-to-br from-yellow-300/10 to-pink-400/10"
          : "border-white/15 bg-white/5"
      }`}
    >
      <div className="flex items-center gap-[8px]">
        {icon}
        <h3 className="text-[16px] font-bold text-white">{title}</h3>
      </div>
      <p className="mt-[10px] text-[14px] leading-[22px] text-white/85">
        {hasContent ? content : (
          <span className="text-white/40">
            이 항목에 대한 원전 구절을 찾지 못했어요.
          </span>
        )}
      </p>
    </section>
  );
}