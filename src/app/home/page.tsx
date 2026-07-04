"use client";
// 홈 화면 페이지 (/home) — 오늘의 인연 카드, 추가 열람, 전광판 노출

import { Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { StatBillboard } from "@/components/home/stat-billboard";
import { MatchCard, type MatchCandidate } from "@/components/matching/match-card";
import { MatchInfoModal } from "@/components/matching/match-info-modal";
import { UnlockModal } from "@/components/matching/unlock-modal";
import { ApiError, apiFetch } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { CACHE_TTL, fetchWithCache } from "@/lib/cache";
import {
  EXTRA_DAILY_LIMIT,
  STAR_COST_PER_CARD,
  getTodayCard,
  unlockExtraCard,
} from "@/lib/matches";
import { notifyStarsChanged } from "@/lib/stars";
import { profileCompletionPct } from "@/lib/profile-completion";

type TodayFortune = {
  fortune_text: string;
  today_pillar: string;
  today_pillar_hanja: string;
  relation: string;
  element_today: string;
  score: number;
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
  bio: string | null;
  height_cm: number | null;
  mbti: string | null;
  job: string | null;
  region: string | null;
  star_balance: number;
};

export default function HomePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [today, setToday] = useState<{ card: MatchCandidate | null } | null>(
    null,
  );
  const [extras, setExtras] = useState<MatchCandidate[]>([]);
  const [extraUsed, setExtraUsed] = useState<number | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [fortune, setFortune] = useState<TodayFortune | null>(null);
  const [guide, setGuide] = useState<ActionGuide | null>(null);
  const [fortuneFailed, setFortuneFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMatch, setActiveMatch] = useState<MatchCandidate | null>(null);
  const [activeIsPaid, setActiveIsPaid] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    apiFetch<Me>("/users/me")
      .then(setMe)
      .catch((e: Error) => setError(e.message));
  }, [router]);

  useEffect(() => {
    if (!me || !me.birth_date) return;
    getTodayCard()
      .then(setToday)
      .catch(() => setToday({ card: null }));
    fetchWithCache<TodayFortune>(
      "/saju/me/today-fortune",
      CACHE_TTL.short,
      setFortune,
      {
        onError: () => {
          setFortuneFailed(true);
        },
      },
    );
    fetchWithCache<ActionGuide>(
      "/saju/me/action-guide",
      CACHE_TTL.short,
      setGuide,
      { onError: () => setGuide(null) },
    );
  }, [me]);

  const completion = profileCompletionPct(me);

  const nickname = me?.nickname ?? "OOO";

  const balance = me?.star_balance ?? 0;
  const todayCard = today?.card ?? null;
  const limitReached = extraUsed !== null && extraUsed >= EXTRA_DAILY_LIMIT;

  const maxUnlock = Math.max(
    0,
    Math.min(
      Math.floor(balance / STAR_COST_PER_CARD),
      EXTRA_DAILY_LIMIT - (extraUsed ?? 0),
    ),
  );

  const openUnlock = () => {
    if (balance < STAR_COST_PER_CARD) return;
    setUnlockOpen(true);
  };

  const handleUnlockN = async (count: number) => {
    if (unlocking) return;
    setUnlocking(true);
    let opened = 0;
    let stopReason: "none" | "pool" | "limit" | "stars" | "error" = "none";
    try {
      for (let i = 0; i < count; i++) {
        try {
          const res = await unlockExtraCard();
          setExtras((prev) => [...prev, res.card]);
          setExtraUsed(res.extra_unlocked_today);
          setMe((prev) =>
            prev ? { ...prev, star_balance: res.star_balance } : prev,
          );
          notifyStarsChanged(res.star_balance);
          opened += 1;
        } catch (e) {
          if (e instanceof ApiError && e.status === 402) stopReason = "stars";
          else if (e instanceof ApiError && e.status === 403) stopReason = "limit";
          else if (e instanceof ApiError && e.status === 404) stopReason = "pool";
          else stopReason = "error";
          break;
        }
      }
    } finally {
      setUnlocking(false);
      setUnlockOpen(false);
    }

    if (stopReason === "none") {
      setToast(`인연 카드 ${opened}장을 열었어요.`);
    } else if (stopReason === "pool") {
      setToast(
        opened > 0
          ? `${count}장 중 ${opened}장만 열었어요. 더 이상 추천할 인연이 없어요.`
          : "오늘은 더 이상 추천할 인연이 없어요.",
      );
    } else if (stopReason === "limit") {
      setToast(`오늘 추가 열람 한도(${EXTRA_DAILY_LIMIT}장)에 도달했어요.`);
    } else if (stopReason === "stars") {
      setToast(
        opened > 0
          ? `인연 카드 ${opened}장을 열었어요. 별이 부족해 더 열지 못했어요.`
          : "별이 부족해요.",
      );
    } else {
      setToast("일부 인연을 열지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  return (
    <AppShell
      topChip={
        me !== null && completion < 100 ? (
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
        {me !== null && completion < 100 && (
          <div className="mt-[14px]">
            <p className="text-center text-[12px] text-[#d8c8f2]">
              현재 <span className="font-medium">{nickname}</span>님의 프로필 진행률{" "}
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
              Tip : 프로필을 완성해볼까요?
            </p>
          </div>
        )}

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

        <section className="mt-[36px]">
          <h2 className="text-center text-[20px] font-bold text-white">
            오늘의 인연
          </h2>

          {today === null ? (
            <p className="mt-[18px] text-center text-[12px] text-white/50">
              오늘의 인연을 찾는 중...
            </p>
          ) : todayCard === null ? (
            <p className="mt-[18px] text-center text-[12px] text-white/50">
              아직 매칭 가능한 상대가 없어요
            </p>
          ) : (
            <div className="mt-[18px]">
              <button
                type="button"
                onClick={() => {
                  setActiveIsPaid(false);
                  setActiveMatch(todayCard);
                }}
                className="relative block w-full text-left transition active:scale-[0.98]"
              >
                <MatchCard data={todayCard} />
              </button>
            </div>
          )}

          {today !== null && today.card !== null && (
            <div className="mt-[18px]">
              {limitReached ? (
                <button
                  type="button"
                  disabled
                  className="flex h-[50px] w-full items-center justify-center rounded-[14px] border border-[#fde047]/50 bg-gradient-to-r from-yellow-300/15 to-pink-400/15 text-[15px] font-bold text-white disabled:opacity-50"
                >
                  오늘의 추가 열람을 모두 사용했어요
                </button>
              ) : balance >= STAR_COST_PER_CARD ? (
                <button
                  type="button"
                  onClick={openUnlock}
                  disabled={unlocking}
                  className="flex h-[50px] w-full items-center justify-center gap-[8px] rounded-[14px] border border-[#fde047]/50 bg-gradient-to-r from-yellow-300/15 to-pink-400/15 text-[15px] font-bold text-white disabled:opacity-50"
                >
                  {unlocking ? (
                    <>인연 카드 여는 중...</>
                  ) : (
                    <>
                      추가 인연 열람하기
                      <span className="flex items-center gap-[3px] text-[#fde047]">
                        <Star className="size-[14px] fill-[#fde047] stroke-[#fde047]" />
                        10
                      </span>
                    </>
                  )}
                </button>
              ) : null}
            </div>
          )}
        </section>

        {extras.length > 0 && (
          <section className="mt-[36px]">
            <h2 className="text-center text-[20px] font-bold text-white">
              더 많은 인연
            </h2>
            <div className="-mx-[24px] mt-[18px] overflow-x-auto pb-[8px] snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex">
                {extras.map((c) => (
                  <div
                    key={c.user_id}
                    className="shrink-0 basis-full snap-center px-[24px]"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveIsPaid(true);
                        setActiveMatch(c);
                      }}
                      className="relative block w-full text-left transition active:scale-[0.98]"
                    >
                      <MatchCard data={c} showScoreTier />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <StatBillboard />

        {error && (
          <p className="mt-[20px] text-center text-xs text-red-300">
            API 오류: {error}
          </p>
        )}
        <div className="mt-[24px] flex flex-col items-center gap-[10px]">
          <button
            type="button"
            onClick={() => setLogoutOpen(true)}
            className="text-[12px] text-white/40 underline underline-offset-2"
          >
            로그아웃
          </button>
          <Link
            href="/privacy"
            className="text-[12px] text-white/40 underline underline-offset-2"
          >
            개인정보처리방침
          </Link>
        </div>
      </div>

      {logoutOpen && (
        <LogoutConfirmModal
          onClose={() => setLogoutOpen(false)}
          onConfirm={() => {
            clearToken();
            router.replace("/");
          }}
        />
      )}

      {activeMatch && (
        <MatchInfoModal
          candidate={activeMatch}
          showScoreTier={activeIsPaid}
          onClose={() => setActiveMatch(null)}
          onOpenDetail={() => {
            router.push(`/profile/${activeMatch.user_id}`);
          }}
          onStartChat={() => {
            sessionStorage.setItem("activeChat", JSON.stringify(activeMatch));
            router.push(`/matching/${activeMatch.user_id}`);
          }}
        />
      )}

      {unlockOpen && (
        <UnlockModal
          balance={balance}
          maxCount={maxUnlock}
          busy={unlocking}
          onConfirm={(count) => handleUnlockN(count)}
          onClose={() => setUnlockOpen(false)}
        />
      )}

      {toast && (
        <div className="fixed bottom-[100px] left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/15 bg-black/70 px-[14px] py-[8px] text-[12px] text-white backdrop-blur-sm">
          {toast}
        </div>
      )}
    </AppShell>
  );
}

function LogoutConfirmModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[300px] rounded-[16px] border border-white/15 bg-[#1f1235] p-[20px]"
      >
        <h3 className="text-center text-[16px] font-bold text-white">
          로그아웃 하시겠어요?
        </h3>
        <p className="mt-[10px] text-center text-[12px] leading-[18px] text-white/70">
          다시 로그인하면 이어서 이용할 수 있어요.
        </p>
        <div className="mt-[16px] flex gap-[8px]">
          <button
            type="button"
            onClick={onClose}
            className="h-[40px] flex-1 rounded-[10px] border border-white/20 bg-white/5 text-[14px] text-white hover:bg-white/10"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-[40px] flex-1 rounded-[10px] bg-[rgba(255,95,95,0.9)] text-[14px] font-bold text-black hover:bg-[rgba(255,95,95,1)]"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}