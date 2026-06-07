"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Heart,
  Sparkles,
  TrendingUp,
  User as UserIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { LoadingPanel } from "@/components/ui/loading-panel";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { CACHE_TTL, fetchWithCache } from "@/lib/cache";

type DestinyAnalysis = {
  user_a_id: number;
  user_b_id: number;
  nickname_a: string | null;
  nickname_b: string | null;
  score: number;
  intro: string;
  personality: string;
  love_style: string;
  caution: string;
  longterm: string;
  interpretation_status: "pending" | "ready";
};

type Me = { id: number; nickname: string | null };
type PeerProfile = { id: number; nickname: string | null };

/**
 * /destiny/[id] — "운명의 실타래 더 깊이 알아보기" CTA 의 도착지.
 *
 * 두 사람 사주를 직접 비교한 5-섹션 LLM 풀이 (첫인상 / 성격 / 연애 스타일 /
 * 주의 / 장기 전망). 자미두수 페이지와는 다르게 한 명의 사주가 아니라
 * 페어 비교에 초점.
 */
export default function DestinyPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const peerId = Number(params.id);
  const [me, setMe] = useState<Me | null>(null);
  const [peer, setPeer] = useState<PeerProfile | null>(null);
  const [data, setData] = useState<DestinyAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    apiFetch<Me>("/users/me")
      .then(setMe)
      .catch(() => {});
  }, [router]);

  // Fast call — partner의 닉네임을 LLM 결과(5~10초) 와 무관하게 즉시 표시.
  useEffect(() => {
    if (!Number.isFinite(peerId)) return;
    apiFetch<PeerProfile>(`/users/${peerId}/public-profile`)
      .then(setPeer)
      .catch(() => {});
  }, [peerId]);

  useEffect(() => {
    if (!Number.isFinite(peerId)) return;
    // LLM 호출이라 5–10초 걸림. 사용자가 같은 쌍의 풀이를 여러 번 보러
    // 와도 매번 기다리지 않게 stale-while-revalidate 캐시 사용.
    fetchWithCache<DestinyAnalysis>(
      `/compatibility/destiny/${peerId}`,
      CACHE_TTL.saju,
      setData,
      { onError: (e: Error) => setError(e.message) },
    );
  }, [peerId]);

  return (
    <AppShell>
      <div className="flex-1 px-[20px]">
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
            운명의 실타래
          </h1>
          <div className="mt-[10px] h-px bg-white/30" />
        </div>

        <PaidView
          data={data}
          error={error}
          myNickname={me?.nickname ?? null}
          peer={peer}
        />
      </div>
    </AppShell>
  );
}

function PaidView({
  data,
  error,
  myNickname,
  peer,
}: {
  data: DestinyAnalysis | null;
  error: string | null;
  myNickname: string | null;
  peer: { id: number; nickname: string | null } | null;
}) {
  // peer (fast endpoint) 가 LLM 결과(5~10초) 보다 먼저 도착하므로
  // 로딩 중에도 실제 닉네임이 표시됨. 둘 다 없으면 "상대" 로 폴백.
  const peerName = data?.nickname_b ?? peer?.nickname ?? "상대";
  return (
    <>
      {/* Hero */}
      <section className="mt-[24px] rounded-[18px] border border-purple-300/30 bg-gradient-to-br from-purple-900/40 via-purple-700/30 to-pink-700/30 p-[20px] backdrop-blur-sm">
        <div className="flex justify-center">
          <div className="grid size-[64px] place-items-center rounded-full bg-gradient-to-br from-yellow-300 to-pink-400 shadow-[0_0_25px_-5px_rgba(253,224,71,0.6)]">
            <Sparkles className="size-[32px] fill-white stroke-white" />
          </div>
        </div>
        <h2 className="mt-[14px] text-center text-[20px] font-bold tracking-tight text-white">
          {myNickname ?? "나"} ↔ {peerName}
        </h2>
        <p className="mt-[6px] text-center text-[12px] text-white/65">
          사주 궁합 점수{" "}
          <span className="font-semibold text-[#fde047]">
            {data?.score ?? "—"}점
          </span>
          {" "}· 두 분의 사주를 직접 비교한 5 섹션 풀이입니다.
        </p>
      </section>

      {!data && !error && (
        <LoadingPanel
          className="mt-[20px]"
          estimatedMs={9000}
          done={!!data}
          messages={[
            { atPct: 0, text: "두 분의 사주를 비교 시작..." },
            { atPct: 25, text: "일간·일지로 케미 점수를 매기는 중..." },
            { atPct: 50, text: "잘 맞는 점·주의할 점 찾는 중..." },
            { atPct: 75, text: "5섹션 풀이 작성 중..." },
            { atPct: 90, text: "거의 다 됐어요!" },
          ]}
        />
      )}

      {error && (
        <section className="mt-[20px] rounded-[14px] border border-red-400/40 bg-red-500/10 p-[16px] text-center text-[12px] text-red-200">
          분석을 불러오지 못했어요. {error}
        </section>
      )}

      {data && data.interpretation_status === "ready" && (
        <div className="mt-[16px] space-y-[12px]">
          {data.intro && (
            <Section
              icon={<Sparkles className="size-[18px] stroke-yellow-300" />}
              title="첫인상"
              body={data.intro}
              accent="yellow"
            />
          )}
          {data.personality && (
            <Section
              icon={<UserIcon className="size-[18px] stroke-purple-300" />}
              title="성격 궁합"
              body={data.personality}
              accent="purple"
            />
          )}
          {data.love_style && (
            <Section
              icon={<Heart className="size-[18px] fill-pink-300 stroke-pink-300" />}
              title="연애 스타일"
              body={data.love_style}
              accent="pink"
            />
          )}
          {data.caution && (
            <Section
              icon={<AlertTriangle className="size-[18px] stroke-amber-300" />}
              title="주의 포인트"
              body={data.caution}
              accent="amber"
            />
          )}
          {data.longterm && (
            <Section
              icon={<TrendingUp className="size-[18px] stroke-emerald-300" />}
              title="장기 전망"
              body={data.longterm}
              accent="emerald"
              highlight
            />
          )}
        </div>
      )}

      {data && data.interpretation_status === "pending" && (
        <section className="mt-[20px] rounded-[14px] border border-white/15 bg-white/5 p-[16px] text-center">
          <p className="text-[13px] leading-[22px] text-white/75">
            분석을 일시적으로 못 했어요. 잠시 후 새로고침 해주세요.
          </p>
        </section>
      )}

      <p className="mt-[20px] text-center text-[10px] text-white/40">
        ※ LLM 보조 풀이로, 가벼운 참고용으로 활용해주세요.
      </p>
    </>
  );
}

function Section({
  icon,
  title,
  body,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  accent: "yellow" | "purple" | "pink" | "amber" | "emerald";
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[14px] border p-[16px] backdrop-blur-sm ${
        highlight
          ? "border-yellow-300/30 bg-gradient-to-br from-yellow-300/10 to-pink-400/10"
          : "border-white/15 bg-white/5"
      }`}
    >
      <h3 className="flex items-center gap-[6px] text-[14px] font-bold text-white">
        {icon}
        {title}
      </h3>
      <p className="mt-[8px] whitespace-pre-line text-[13px] leading-[22px] text-white/85 text-ko">
        {body}
      </p>
    </div>
  );
}