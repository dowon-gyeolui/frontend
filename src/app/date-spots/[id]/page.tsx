"use client";

import { ArrowLeft, HeartHandshake, Lock, MapPin, Sparkles } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { PaymentModal } from "@/components/payment/payment-modal";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { CACHE_TTL, fetchWithCache } from "@/lib/cache";

type DateSpot = { title: string; description: string };
type DateRecommendation = {
  user_a_id: number;
  user_b_id: number;
  nickname_a: string | null;
  nickname_b: string | null;
  score: number;
  overview: string;
  spots: DateSpot[];
  interpretation_status: "pending" | "ready";
};

type Me = { id: number; is_paid: boolean };

/**
 * /date-spots/[id] — 운명 분석 리포트의 "두 분만을 위한 최적의 데이트 확인"
 * CTA 가 도달하는 페이지.
 *
 * Free → 페이월 + PaymentModal. Paid → GET /compatibility/date-recommendation
 * 로 LLM 이 추천한 4~5개 장소 카테고리 + overview 노출.
 */
export default function DateSpotsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const peerId = Number(params.id);
  const [me, setMe] = useState<Me | null>(null);
  const [data, setData] = useState<DateRecommendation | null>(null);
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

  useEffect(() => {
    if (!me || !me.is_paid) return;
    // LLM 호출. 캐시해서 같은 쌍의 추천을 다시 볼 때 즉시 표시.
    fetchWithCache<DateRecommendation>(
      `/compatibility/date-recommendation/${peerId}`,
      CACHE_TTL.saju,
      setData,
      { onError: (e: Error) => setError(e.message) },
    );
  }, [me, peerId]);

  return (
    <AppShell>
      <div className="flex-1 px-[20px]">
        {/* Sub-header */}
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
            데이트 장소 추천
          </h1>
          <div className="mt-[10px] h-px bg-white/30" />
        </div>

        {!me?.is_paid ? (
          <Paywall onUpgrade={() => setPaymentOpen(true)} />
        ) : (
          <PaidView data={data} error={error} />
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

/* ── Paid view — actual recommendation ── */
function PaidView({
  data,
  error,
}: {
  data: DateRecommendation | null;
  error: string | null;
}) {
  return (
    <>
      <section className="mt-[24px] rounded-[18px] border border-pink-300/30 bg-gradient-to-br from-pink-700/30 via-purple-700/30 to-purple-900/40 p-[20px] backdrop-blur-sm">
        <div className="flex justify-center">
          <div className="grid size-[64px] place-items-center rounded-full bg-gradient-to-br from-pink-300 to-yellow-300 shadow-[0_0_25px_-5px_rgba(244,114,182,0.6)]">
            <HeartHandshake className="size-[32px] fill-white stroke-white" />
          </div>
        </div>
        <h2 className="mt-[14px] text-center text-[22px] font-bold text-white">
          {data?.nickname_b ?? "상대"} 님과의 데이트
        </h2>
        <p className="mt-[8px] text-center text-[12px] text-white/70">
          사주 궁합 {data?.score ?? "—"}점 · 두 분의 기운에 어울리는 데이트 장소를
          추천해드려요.
        </p>
      </section>

      {!data && !error && (
        <section className="mt-[20px] rounded-[14px] border border-white/15 bg-white/5 p-[20px] text-center">
          <div className="mx-auto size-8 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="mt-[10px] text-[12px] text-white/60">
            두 분의 사주를 분석해 데이트 장소를 골라보고 있어요... 5~10초 소요
          </p>
        </section>
      )}

      {error && (
        <section className="mt-[20px] rounded-[14px] border border-red-400/40 bg-red-500/10 p-[16px] text-center text-[12px] text-red-200">
          추천을 불러오지 못했어요. {error}
        </section>
      )}

      {data && data.interpretation_status === "ready" && (
        <>
          {data.overview && (
            <section className="mt-[16px] rounded-[14px] border border-white/15 bg-white/5 p-[16px]">
              <h3 className="flex items-center gap-[6px] text-[14px] font-bold text-white">
                <Sparkles className="size-[14px] fill-yellow-300 stroke-yellow-300" />
                두 분의 데이트 스타일
              </h3>
              <p className="mt-[8px] whitespace-pre-line text-[13px] leading-[22px] text-white/85">
                {data.overview}
              </p>
            </section>
          )}

          {data.spots.length > 0 && (
            <section className="mt-[14px] space-y-[10px]">
              <h3 className="flex items-center gap-[6px] text-[14px] font-bold text-white">
                <MapPin className="size-[14px] stroke-pink-300" />
                추천 데이트 장소
              </h3>
              {data.spots.map((s, i) => (
                <div
                  key={s.title + i}
                  className="rounded-[14px] border border-white/15 bg-white/5 p-[14px]"
                >
                  <div className="flex items-center gap-[8px]">
                    <div className="grid size-[26px] place-items-center rounded-full bg-pink-400/20 text-[12px] font-bold text-pink-200">
                      {i + 1}
                    </div>
                    <p className="text-[15px] font-semibold text-white">{s.title}</p>
                  </div>
                  <p className="mt-[8px] text-[12px] leading-[20px] text-white/75">
                    {s.description}
                  </p>
                </div>
              ))}
            </section>
          )}
        </>
      )}

      {data && data.interpretation_status === "pending" && (
        <section className="mt-[20px] rounded-[14px] border border-white/15 bg-white/5 p-[16px] text-center">
          <p className="text-[13px] leading-[22px] text-white/75">
            추천 생성을 일시적으로 못 했어요. 잠시 후 새로 고침 해주세요.
          </p>
        </section>
      )}

      <p className="mt-[20px] text-center text-[10px] text-white/40">
        ※ 추천 장소는 LLM 보조 결과로, 가벼운 참고용으로 활용해주세요.
      </p>
    </>
  );
}

/* ── Paywall — non-paid users ── */
function Paywall({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <>
      <section className="mt-[24px] rounded-[18px] border border-pink-300/30 bg-gradient-to-br from-pink-700/30 via-purple-700/30 to-purple-900/40 p-[20px] text-center backdrop-blur-sm">
        <div className="flex justify-center">
          <div className="grid size-[64px] place-items-center rounded-full bg-gradient-to-br from-pink-300 to-yellow-300 shadow-[0_0_25px_-5px_rgba(244,114,182,0.6)]">
            <HeartHandshake className="size-[32px] fill-white stroke-white" />
          </div>
        </div>
        <h2 className="mt-[14px] text-[20px] font-bold text-white">
          두 분만을 위한 최적의 데이트
        </h2>
        <p className="mt-[10px] text-[13px] leading-[20px] text-white/80">
          두 분의 사주·MBTI 를 분석해
          <br />
          어울리는 데이트 장소 4~5곳을 추천해드려요.
        </p>
      </section>

      <section className="mt-[24px]">
        <h3 className="text-[16px] font-bold text-white">이런 게 보여요</h3>
        <ul className="mt-[12px] space-y-[10px] text-[14px] text-white/85">
          <li className="flex gap-[10px]">
            <span className="text-pink-300">✦</span>
            <span>
              <span className="font-semibold">데이트 스타일 요약</span> — 두 분의
              기운이 어울리는 분위기
            </span>
          </li>
          <li className="flex gap-[10px]">
            <span className="text-pink-300">✦</span>
            <span>
              <span className="font-semibold">장소 4~5곳</span> — 카페·산책로·전시
              등 카테고리 추천
            </span>
          </li>
          <li className="flex gap-[10px]">
            <span className="text-pink-300">✦</span>
            <span>
              <span className="font-semibold">근거 설명</span> — 왜 두 분에게 잘
              맞는지 한 줄 풀이
            </span>
          </li>
        </ul>
      </section>

      <section className="mt-[28px] rounded-[18px] border-2 border-pink-300/50 bg-gradient-to-br from-pink-300/10 to-yellow-300/10 p-[20px] text-center">
        <p className="text-[12px] font-medium uppercase tracking-wider text-pink-200">
          premium
        </p>
        <p className="mt-[6px] text-[28px] font-bold text-white">9,900원</p>
        <p className="mt-[4px] text-[12px] text-white/60">월간 구독 · 언제든 해지</p>

        <button
          type="button"
          onClick={onUpgrade}
          className="mt-[18px] flex h-[52px] w-full items-center justify-center gap-[8px] rounded-[12px] bg-gradient-to-r from-pink-400 to-yellow-300 text-[16px] font-bold text-[#1b1029] shadow-[0_0_15px_-3px_rgba(244,114,182,0.6)] hover:opacity-90"
        >
          <Lock className="size-[16px]" />
          프리미엄 가입하고 추천 받기 →
        </button>
      </section>

      <p className="mt-[20px] text-center text-[10px] text-white/40">
        ※ 결제 시스템 정식 출시 전 데모 모드 — 결제하기 누르면 바로 활성화됩니다.
      </p>
    </>
  );
}