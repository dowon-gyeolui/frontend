"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Heart,
  HeartHandshake,
  Lock,
  Sparkles,
  TrendingUp,
  User as UserIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { PaymentModal } from "@/components/payment/payment-modal";
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

type Me = { id: number; is_paid: boolean; nickname: string | null };
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
  const [paymentOpen, setPaymentOpen] = useState(false);

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
    if (!me || !me.is_paid) return;
    // LLM 호출이라 5–10초 걸림. 사용자가 같은 쌍의 풀이를 여러 번 보러
    // 와도 매번 기다리지 않게 stale-while-revalidate 캐시 사용.
    fetchWithCache<DestinyAnalysis>(
      `/compatibility/destiny/${peerId}`,
      CACHE_TTL.saju,
      setData,
      { onError: (e: Error) => setError(e.message) },
    );
  }, [me, peerId]);

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

        {!me?.is_paid ? (
          <Paywall onUpgrade={() => setPaymentOpen(true)} />
        ) : (
          <PaidView
            data={data}
            error={error}
            myNickname={me?.nickname ?? null}
            peer={peer}
          />
        )}
      </div>

      {paymentOpen && (
        <PaymentModal
          reason="general"
          onClose={() => setPaymentOpen(false)}
          onPaid={() => {
            setMe((prev) => (prev ? { ...prev, is_paid: true } : prev));
            setPaymentOpen(false);
          }}
        />
      )}
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
        <section className="mt-[20px] rounded-[14px] border border-white/15 bg-white/5 p-[20px] text-center">
          <div className="mx-auto size-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="mt-[10px] text-[12px] text-white/60">
            두 분 사주를 비교 분석하고 있어요... 5~10초 소요
          </p>
        </section>
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
      <p className="mt-[8px] whitespace-pre-line text-[13px] leading-[22px] text-white/85">
        {body}
      </p>
    </div>
  );
}

function Paywall({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <>
      <section className="mt-[24px] rounded-[18px] border border-purple-300/30 bg-gradient-to-br from-purple-900/40 via-purple-700/30 to-pink-700/30 p-[20px] text-center backdrop-blur-sm">
        <div className="flex justify-center">
          <div className="grid size-[64px] place-items-center rounded-full bg-gradient-to-br from-yellow-300 to-pink-400 shadow-[0_0_25px_-5px_rgba(253,224,71,0.6)]">
            <HeartHandshake className="size-[32px] fill-white stroke-white" />
          </div>
        </div>
        <h2 className="mt-[14px] text-[20px] font-bold text-white">
          운명의 실타래 더 깊이 알아보기
        </h2>
        <p className="mt-[10px] text-[13px] leading-[20px] text-white/80">
          두 분의 사주를 직접 비교해
          <br />
          첫인상·성격·연애 스타일·갈등 포인트·장기 전망을
          <br />
          섹션별로 풀어드려요.
        </p>
      </section>

      <section className="mt-[24px]">
        <h3 className="text-[16px] font-bold text-white">이런 게 보여요</h3>
        <ul className="mt-[12px] space-y-[10px] text-[14px] text-white/85">
          <li className="flex gap-[10px]">
            <span className="text-[#fde047]">✦</span>
            <span>
              <span className="font-semibold">첫인상</span> — 두 분 사주의 전체 인상
            </span>
          </li>
          <li className="flex gap-[10px]">
            <span className="text-[#fde047]">✦</span>
            <span>
              <span className="font-semibold">성격 궁합</span> — 일주(日柱) 비교 풀이
            </span>
          </li>
          <li className="flex gap-[10px]">
            <span className="text-[#fde047]">✦</span>
            <span>
              <span className="font-semibold">연애 스타일</span> — 표현 방식과 케미
            </span>
          </li>
          <li className="flex gap-[10px]">
            <span className="text-[#fde047]">✦</span>
            <span>
              <span className="font-semibold">주의 포인트 + 장기 전망</span>
            </span>
          </li>
        </ul>
      </section>

      <section className="mt-[28px] rounded-[18px] border-2 border-yellow-300/50 bg-gradient-to-br from-yellow-300/10 to-pink-400/10 p-[20px] text-center">
        <p className="text-[12px] font-medium uppercase tracking-wider text-[#fde047]">
          premium
        </p>
        <p className="mt-[6px] text-[28px] font-bold text-white">9,900원</p>
        <p className="mt-[4px] text-[12px] text-white/60">월간 구독 · 언제든 해지</p>

        <button
          type="button"
          onClick={onUpgrade}
          className="mt-[18px] flex h-[52px] w-full items-center justify-center gap-[8px] rounded-[12px] bg-gradient-to-r from-yellow-300 to-pink-400 text-[16px] font-bold text-[#1b1029] shadow-[0_0_15px_-3px_rgba(253,224,71,0.6)] hover:opacity-90"
        >
          <Lock className="size-[16px]" />
          프리미엄 가입하고 풀이 받기 →
        </button>
      </section>

      <p className="mt-[20px] text-center text-[10px] text-white/40">
        ※ 결제 시스템 정식 출시 전 데모 모드 — 결제하기 누르면 바로 활성화됩니다.
      </p>
    </>
  );
}