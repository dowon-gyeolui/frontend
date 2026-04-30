"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import {
  DailyMatchSlotCard,
  type DailyMatchSlot,
} from "@/components/matching/daily-match-slot-card";
import { type MatchCandidate } from "@/components/matching/match-card";
import { MatchInfoModal } from "@/components/matching/match-info-modal";
import { PaymentModal } from "@/components/payment/payment-modal";
import { apiFetch } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { CACHE_TTL, fetchWithCache } from "@/lib/cache";
import { profileCompletionPct } from "@/lib/profile-completion";
import { dominantElement, type ElementProfile } from "@/lib/saju";

type DailyMatchPack = {
  assigned_at: string;
  next_cycle_at: string;
  slots: DailyMatchSlot[];
};

type Me = {
  id: number;
  nickname: string | null;
  photo_url: string | null;
  birth_date: string | null;
  birth_time: string | null;
  gender: string | null;
  is_paid: boolean;
  bio: string | null;
  height_cm: number | null;
  mbti: string | null;
  job: string | null;
  region: string | null;
};

type SajuResponseLite = {
  element_profile: ElementProfile;
};

// Action tips are derived from the user's dominant element when available.
// Once the backend exposes per-day recommendations they'll come from
// /recommendations/today; for now we render only what we can defend.
function tipsForElement(dominant: string | null): string[] | null {
  switch (dominant) {
    case "wood":
      return ["산책이나 자연 속 대화가 첫인상 상승에 유리", "오전 시간대 만남 추천", "초록색 액세서리로 포인트"];
    case "fire":
      return ["밝은 색 옷이 첫인상 상승에 유리", "저녁 시간대 대화 시작 추천", "직설적인 표현보다 돌려 말하는 게 좋음"];
    case "earth":
      return ["편안한 카페에서의 대화가 좋음", "오후 시간대 만남 추천", "황토색·베이지 톤 의상이 유리"];
    case "metal":
      return ["깔끔한 정장 스타일이 첫인상에 유리", "낮 시간대 짧고 명료한 대화 추천", "흰색·은색 포인트 추천"];
    case "water":
      return ["조용한 곳에서 깊은 대화가 좋음", "밤 시간대 진솔한 대화 추천", "남색·검은색 톤 의상이 유리"];
    default:
      return null;
  }
}

export default function HomePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [pack, setPack] = useState<DailyMatchPack | null>(null);
  const [saju, setSaju] = useState<SajuResponseLite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeMatch, setActiveMatch] = useState<MatchCandidate | null>(null);
  // When set, the payment modal is shown over the home grid. The reason
  // distinguishes between starting a chat (existing flow) and unlocking
  // the jamidusu paid slot.
  const [paymentTarget, setPaymentTarget] = useState<{
    candidate: MatchCandidate | null;
    reason: "chat" | "jamidusu";
  } | null>(null);
  // Lightweight toast shown when the user taps a still-locked countdown
  // card. Auto-dismisses after a couple of seconds.
  const [lockedToast, setLockedToast] = useState<string | null>(null);
  useEffect(() => {
    if (!lockedToast) return;
    const t = window.setTimeout(() => setLockedToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [lockedToast]);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    apiFetch<Me>("/users/me")
      .then(setMe)
      .catch((e: Error) => setError(e.message));
  }, [router]);

  // Fetch today's 4-slot pack + own saju once birth_date is known —
  // backend rejects both endpoints before onboarding is complete.
  // Both go through fetchWithCache so a returning user sees the previous
  // values immediately while we revalidate in the background.
  useEffect(() => {
    if (!me || !me.birth_date) return;
    fetchWithCache<DailyMatchPack>(
      "/compatibility/today",
      CACHE_TTL.matches,
      setPack,
      { onError: () => setPack({ assigned_at: new Date().toISOString(), next_cycle_at: new Date().toISOString(), slots: [] }) },
    );
    fetchWithCache<SajuResponseLite>(
      "/saju/me",
      CACHE_TTL.saju,
      setSaju,
      { onError: () => setSaju(null) },
    );
  }, [me]);

  // Action tips depend on the user's dominant element. Hidden until saju
  // arrives so we never show stale generic copy.
  const tips =
    saju !== null ? tipsForElement(dominantElement(saju.element_profile)) : null;

  const completion = profileCompletionPct(me);

  const nickname = me?.nickname ?? "OOO";

  return (
    <AppShell
      topChip={
        completion < 100 ? (
          <Link
            href="/mypage?incomplete=1"
            className="grid h-[18px] place-items-center rounded-full bg-[#fde047] px-3 text-[12px] font-medium text-[#1b1029]"
          >
            프로필 완성하기 →
          </Link>
        ) : null
      }
    >
      <div className="flex-1 px-[24px]">
        {/* Top: 인연 탐색기 가동률 */}
        <div className="mt-[14px]">
          <p className="text-center text-[12px] text-[#d8c8f2]">
            현재 <span className="font-medium">{nickname}</span>님의 인연 탐색기 가동률{" "}
            <span className="font-semibold text-[#fde047]">{completion}%</span>
          </p>
          <div className="mt-[10px] h-[12px] w-full overflow-hidden rounded-full bg-[#3a245c]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${completion}%`,
                backgroundImage:
                  "linear-gradient(101deg, rgb(124, 58, 237) 0%, rgb(168, 85, 247) 100%)",
              }}
            />
          </div>
          <p className="mt-[8px] text-[12px] text-[#d8c8f2]">
            Tip : 프로필을 완성할수록 운명의 상대를 만날 확률이 올라요!
          </p>
        </div>

        {/* 오늘의 인연운 */}
        <section className="mt-[20px] rounded-[18px] border border-white/20 bg-white/10 p-[16px] backdrop-blur-sm">
          <h2 className="text-center text-[20px] font-bold text-white">오늘의 인연운</h2>
          <p className="mt-[12px] whitespace-pre-line text-center text-[14px] text-[#d8c8f2]">
            {`"${nickname}님은 오늘 운명의 상대를 만날 확률이 높아요!\n맘에 두고 있는 사람이 있다면 표현해볼까요?"`}
          </p>
        </section>

        {/* 오늘의 매칭 카드 — 4-슬롯 (saju 무료 / jamidusu 유료 / 24h × 2). */}
        <section className="mt-[36px]">
          <h2 className="text-center text-[20px] font-bold text-white">
            오늘의 매칭 카드
          </h2>
          {pack === null ? (
            <p className="mt-[18px] text-center text-[12px] text-white/50">
              매칭 후보를 분석 중...
            </p>
          ) : pack.slots.length === 0 ? (
            <p className="mt-[18px] text-center text-[12px] text-white/50">
              아직 매칭 가능한 상대가 없어요
            </p>
          ) : (
            <div className="mt-[18px] grid grid-cols-2 gap-x-[16px] gap-y-[26px]">
              {pack.slots.map((slot) => (
                <DailyMatchSlotCard
                  key={slot.slot_index}
                  slot={slot}
                  onOpen={() => setActiveMatch(slot.candidate)}
                  onPaywallClick={() =>
                    setPaymentTarget({
                      candidate: slot.candidate,
                      reason: "jamidusu",
                    })
                  }
                  onLockedClick={() =>
                    setLockedToast(
                      "곧 공개되는 인연이에요. 카운트다운이 끝나면 자동으로 열려요.",
                    )
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* 행동 가이드 — saju 호출이 5~10초 걸리니까 로딩 상태도 보여준다. */}
        {me?.birth_date && (
          <section className="mt-[40px]">
            <h2 className="text-center text-[20px] font-bold text-white">
              행동 가이드
            </h2>
            {tips ? (
              <div className="mt-[14px] flex flex-col items-center gap-[6px] text-center text-[14px] text-white">
                {tips.map((tip) => (
                  <p key={tip} className="leading-[25px]">{`"${tip}"`}</p>
                ))}
              </div>
            ) : saju === null ? (
              <div className="mt-[14px] flex flex-col items-center gap-[10px]">
                <div className="size-7 animate-spin rounded-full border-[3px] border-white/20 border-t-white" />
                <p className="text-[12px] leading-[18px] text-white/60">
                  사주를 풀어 오늘의 행동 가이드를 찾고 있어요...
                  <br />
                  잠시만 기다려주세요.
                </p>
              </div>
            ) : (
              <p className="mt-[14px] text-center text-[12px] text-white/55">
                오늘은 추천드릴 가이드가 없어요.
              </p>
            )}
          </section>
        )}

        {error && (
          <p className="mt-[20px] text-center text-xs text-red-300">
            API 오류: {error}
          </p>
        )}
        <div className="mt-[24px] flex justify-center">
          <button
            type="button"
            onClick={() => {
              clearToken();
              router.replace("/");
            }}
            className="text-[12px] text-white/40 underline underline-offset-2"
          >
            로그아웃
          </button>
        </div>
      </div>

      {activeMatch && (
        <MatchInfoModal
          candidate={activeMatch}
          onClose={() => setActiveMatch(null)}
          onOpenDetail={() => {
            router.push(`/profile/${activeMatch.user_id}`);
          }}
          onStartChat={() => {
            // Free users hit the payment modal; paid users go straight in.
            if (!me?.is_paid) {
              setPaymentTarget({ candidate: activeMatch, reason: "chat" });
              return;
            }
            sessionStorage.setItem("activeChat", JSON.stringify(activeMatch));
            router.push(`/matching/${activeMatch.user_id}`);
          }}
        />
      )}

      {paymentTarget && (
        <PaymentModal
          reason={paymentTarget.reason === "chat" ? "chat" : "general"}
          onClose={() => setPaymentTarget(null)}
          onPaid={() => {
            setMe((prev) => (prev ? { ...prev, is_paid: true } : prev));
            const target = paymentTarget;
            setPaymentTarget(null);
            // After payment, clear cache so /compatibility/today refetches
            // with the slot-1/3 photos un-blinded.
            if (target.reason === "chat" && target.candidate) {
              setActiveMatch(null);
              sessionStorage.setItem("activeChat", JSON.stringify(target.candidate));
              router.push(`/matching/${target.candidate.user_id}`);
            }
            // For "jamidusu" reason we just stay on /home — the next
            // pack fetch will reveal slot 1 / 3 photos automatically.
          }}
        />
      )}

      {/* Locked-card toast — pinned bottom-center */}
      {lockedToast && (
        <div className="fixed bottom-[100px] left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/15 bg-black/70 px-[14px] py-[8px] text-[12px] text-white backdrop-blur-sm">
          {lockedToast}
        </div>
      )}
    </AppShell>
  );
}