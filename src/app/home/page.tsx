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
import { InfoBadge } from "@/components/saju/info-badge";
import { apiFetch } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { CACHE_TTL, fetchWithCache } from "@/lib/cache";
import { profileCompletionPct } from "@/lib/profile-completion";
import {
  BADGE_GLOSSARY,
  ELEMENT_GLOSSARY,
  TEN_GOD_GLOSSARY,
  TODAY_PILLAR_GLOSSARY,
} from "@/lib/saju-glossary-data";

type DailyMatchPack = {
  assigned_at: string;
  next_cycle_at: string;
  slots: DailyMatchSlot[];
};

type TodayFortune = {
  fortune_text: string;
  today_pillar: string;
  today_pillar_hanja: string;
  relation: string;
  element_today: string;
  score: number;
  headline: string;
  person_type: string;
  timing: string;
  place: string;
  caution: string;
  lucky_color: string;
  badges: string[];
};

type ActionGuide = { text: string };

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

export default function HomePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [pack, setPack] = useState<DailyMatchPack | null>(null);
  const [fortune, setFortune] = useState<TodayFortune | null>(null);
  const [guide, setGuide] = useState<ActionGuide | null>(null);
  // fortune fetch 가 실패한 적 있는지 — null 만으론 "로딩 중" 과
  // "실패" 를 구분 못 해서 사용자가 영원히 placeholder 만 보게 됨.
  // 한번이라도 실패하면 fallback 문구로 전환.
  const [fortuneFailed, setFortuneFailed] = useState(false);
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
    // 오늘의 인연운 — KST 일진 기반. 매일 자정에 결과가 바뀌므로
    // 짧은 캐시 (5분 정도면 같은 세션 안에선 안정적이고, 자정 넘기면
    // 자연스럽게 새 값으로 갱신됨).
    fetchWithCache<TodayFortune>(
      "/saju/me/today-fortune",
      CACHE_TTL.short,
      setFortune,
      {
        onError: () => {
          // 백엔드 미배포 / 일시 장애 시 placeholder 가 영원히 노출
          // 되지 않도록 실패 플래그 세팅 → 정적 fallback 문구 표시.
          setFortuneFailed(true);
        },
      },
    );
    // 행동 가이드 — 사주 기반 동적 추천 (색상/시간대/장소/의상 등).
    fetchWithCache<ActionGuide>(
      "/saju/me/action-guide",
      CACHE_TTL.short,
      setGuide,
      { onError: () => setGuide(null) },
    );
  }, [me]);

  // 행동 가이드는 백엔드 /saju/me/action-guide 응답을 그대로 사용.
  // 이전 tipsForElement(...) 정적 룩업은 더 이상 필요 없음.

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

        {/* 오늘의 인연운 — 백엔드 /saju/me/today-fortune 응답.
            KST 일진(日辰)이 매일 바뀌므로 결과 문구도 매일 갱신됨.
            응답 도착 전엔 프로필 미완성 사용자엔 기본 문구. */}
        <section className="mt-[20px] rounded-[18px] border border-white/20 bg-white/10 p-[16px] backdrop-blur-sm">
          <div className="flex items-center justify-center gap-[8px]">
            <h2 className="text-center text-[20px] font-bold text-white">
              오늘의 인연운
            </h2>
            {fortune && (
              <InfoBadge
                label={`오늘 일주 ${fortune.today_pillar}`}
                entry={
                  ELEMENT_GLOSSARY[fortune.element_today] ?? TODAY_PILLAR_GLOSSARY
                }
                variant="yellow"
              />
            )}
          </div>
          <p className="mt-[12px] whitespace-pre-line text-center text-[14px] leading-[22px] text-[#d8c8f2]">
            {fortune
              ? fortune.fortune_text
              : !me?.birth_date
                ? `"${nickname}님, 생년월일을 입력하면 매일 오늘의 인연운을 받을 수 있어요!"`
                : fortuneFailed
                  // API 실패 시: 옛 정적 문구로 fallback. 사용자에겐 빈
                  // 화면보다 자연스러움. 백엔드 복구되면 자동 dynamic 으로.
                  ? `"${nickname}님은 오늘 운명의 상대를 만날 확률이 높아요!\n맘에 두고 있는 사람이 있다면 표현해볼까요?"`
                  : `"${nickname}님의 오늘 인연운을 풀고 있어요..."`}
          </p>
          {fortune && (
            <>
              <div className="mt-[8px] flex items-center justify-center gap-[6px] text-[11px] text-white/55">
                <span>
                  {"★".repeat(fortune.score)}
                  {"☆".repeat(5 - fortune.score)}
                </span>
                {TEN_GOD_GLOSSARY[fortune.relation] && (
                  <InfoBadge
                    label={fortune.relation}
                    entry={TEN_GOD_GLOSSARY[fortune.relation]}
                    variant="muted"
                  />
                )}
              </div>
              {fortune.badges.length > 0 && (
                <div className="mt-[8px] flex flex-wrap justify-center gap-[6px]">
                  {fortune.badges.map((b) =>
                    BADGE_GLOSSARY[b] ? (
                      <InfoBadge
                        key={b}
                        label={b}
                        entry={BADGE_GLOSSARY[b]}
                        variant="yellow"
                      />
                    ) : (
                      <span
                        key={b}
                        className="rounded-full bg-[#fde047]/15 px-[8px] py-[2px] text-[10px] font-semibold text-[#fde047]"
                      >
                        {b}
                      </span>
                    ),
                  )}
                </div>
              )}
            </>
          )}
        </section>

        {/* 얼굴 사진 미등록 시 게이트 배너 — 매칭 카드 자체를 가리고
            대신 안내 + CTA 노출. 백엔드도 photo_url IS NULL 인 사용자
            에겐 빈 pack 을 돌려주지만, 이 배너로 사용자 인지 강화. */}
        {me && me.photo_url === null && (
          <section
            className="mt-[24px] rounded-[18px] border border-[#fde047]/40 bg-gradient-to-br from-[#fde047]/15 to-[#a78bfa]/10 p-[16px] backdrop-blur-sm"
          >
            <h2 className="text-center text-[16px] font-bold text-[#fde047]">
              ZAMI 인증 얼굴 사진을 등록해주세요
            </h2>
            <p className="mt-[8px] text-center text-[12px] leading-[18px] text-white/80">
              매칭은 얼굴이 잘 보이는 본인 사진(얼굴 면적 25% 이상)을
              메인으로 등록해야 시작돼요.
              <br />
              등록 시 ZAMI 공식 인증 뱃지가 함께 노출됩니다.
            </p>
            <Link
              href="/mypage"
              className="mx-auto mt-[14px] block w-fit rounded-full bg-[#fde047] px-[16px] py-[6px] text-[13px] font-bold text-[#1b1029]"
            >
              지금 등록하기 →
            </Link>
          </section>
        )}

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

        {/* 행동 가이드 — 백엔드 /saju/me/action-guide 응답.
            사용자 사주(일주 + 오행) + 오늘 일진을 종합해 항목별 추천. */}
        {me?.birth_date && (
          <section className="mt-[40px]">
            <h2 className="text-center text-[20px] font-bold text-white">
              행동 가이드
            </h2>
            {guide ? (
              <p className="mt-[14px] whitespace-pre-line text-center text-[14px] leading-[24px] text-[#d8c8f2]">
                {guide.text}
              </p>
            ) : (
              <div className="mt-[14px] flex flex-col items-center gap-[10px]">
                <div className="size-7 animate-spin rounded-full border-[3px] border-white/20 border-t-white" />
                <p className="text-[12px] leading-[18px] text-white/60">
                  사주를 풀어 오늘의 행동 가이드를 찾고 있어...
                </p>
              </div>
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

