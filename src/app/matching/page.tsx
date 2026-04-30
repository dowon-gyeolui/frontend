"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Lock } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ChatThreadRow } from "@/components/matching/chat-thread-row";
import { MatchCard, type MatchCandidate } from "@/components/matching/match-card";
import { MatchInfoModal } from "@/components/matching/match-info-modal";
import { PaymentModal } from "@/components/payment/payment-modal";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { CACHE_TTL, fetchWithCache } from "@/lib/cache";
import { leaveThread, listThreads, type ChatThreadSummary } from "@/lib/chat";

type Me = { id: number; is_paid: boolean };

type Tab = "list" | "chat";

type SlotMatchBasis = "saju" | "jamidusu";

type HistoryMatchEntry = {
  candidate: MatchCandidate;
  slot_index: number;
  match_basis: SlotMatchBasis;
  assigned_at: string;
  unlock_at: string;
  is_locked: boolean;
  requires_payment: boolean;
};

export default function MatchingPage() {
  // useSearchParams() requires a Suspense boundary in Next 16 client
  // components — wrap so the fallback shows while the URL parses.
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
      <MatchingPageContent />
    </Suspense>
  );
}

function MatchingPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  // Default to "list" but honour ?tab=chat so the back button from the
  // chat room lands directly on the chat list instead of the matching
  // list (which forced the user to retap to find the conversation).
  const initialTab: Tab = params.get("tab") === "chat" ? "chat" : "list";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [history, setHistory] = useState<HistoryMatchEntry[] | null>(null);
  // Toast for taps on still-locked history rows (slot 2/3 within their
  // 24h countdown window).
  const [lockedToast, setLockedToast] = useState<string | null>(null);
  useEffect(() => {
    if (!lockedToast) return;
    const t = window.setTimeout(() => setLockedToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [lockedToast]);
  const [threads, setThreads] = useState<ChatThreadSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeMatch, setActiveMatch] = useState<MatchCandidate | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  // When set, the payment modal is shown on top of MatchInfoModal. The
  // candidate is remembered so we can navigate to their chat after payment.
  const [paymentTarget, setPaymentTarget] = useState<MatchCandidate | null>(null);
  // Which thread row currently has its swipe-action revealed. Only one
  // row can be open at a time so the UI stays unambiguous.
  const [openThreadId, setOpenThreadId] = useState<number | null>(null);

  const handleLeaveThread = async (t: ChatThreadSummary) => {
    if (!confirm(`${t.peer.nickname ?? "이 채팅"} 방에서 나가시겠어요?\n나간 후에는 더 이상 보이지 않아요.`)) {
      return;
    }
    // Optimistic removal — drop from local state, then call backend.
    // If the request fails, re-fetch to restore the row.
    setThreads((prev) => prev?.filter((x) => x.thread_id !== t.thread_id) ?? prev);
    setOpenThreadId(null);
    try {
      await leaveThread(t.thread_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "채팅방 나가기 실패");
      // Re-fetch to undo the optimistic removal.
      listThreads().then(setThreads).catch(() => {});
    }
  };

  // Auth + initial fetch (matches always; threads only when chat tab opened)
  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    apiFetch<Me>("/users/me")
      .then(setMe)
      .catch(() => {});
    // Cumulative match history. Backend returns one row per unique
    // candidate ever assigned to this user, with locks recomputed
    // against the current time.
    fetchWithCache<HistoryMatchEntry[]>(
      "/compatibility/history",
      CACHE_TTL.matches,
      setHistory,
      { onError: (e: Error) => setError(e.message) },
    );
  }, [router]);

  // Refresh threads when the chat tab becomes active (cheap, on each click).
  useEffect(() => {
    if (tab !== "chat") return;
    listThreads()
      .then(setThreads)
      .catch((e: Error) => setError(e.message));
  }, [tab]);

  return (
    <AppShell>
      <div className="relative grid grid-cols-2 px-[20px] pt-[14px]">
        <TabButton label="매칭 리스트" active={tab === "list"} onClick={() => setTab("list")} />
        <div className="absolute inset-y-[14px] left-1/2 w-px bg-white/40" />
        <TabButton label="채팅" active={tab === "chat"} onClick={() => setTab("chat")} />
      </div>

      {tab === "list" ? (
        <div className="px-[20px] pt-[18px]">
          {error && (
            <p className="mt-4 text-center text-sm text-red-300">
              매칭 히스토리를 불러오지 못했어요: {error}
            </p>
          )}
          {history === null && !error && (
            <p className="mt-8 text-center text-[12px] text-white/50">
              매칭 히스토리를 불러오는 중...
            </p>
          )}
          {history !== null && history.length === 0 && (
            <div className="mt-8 text-center text-[12px] text-white/60">
              <p>아직 매칭된 상대가 없어요</p>
              <p className="mt-1 text-white/40">
                홈 화면의 오늘의 매칭 카드부터 시작해보세요.
              </p>
            </div>
          )}
          {history !== null && history.length > 0 && (
            <div className="grid grid-cols-2 gap-[16px]">
              {history.map((entry) => (
                <HistoryCard
                  key={`${entry.candidate.user_id}-${entry.assigned_at}`}
                  entry={entry}
                  onOpen={() => {
                    if (entry.is_locked) {
                      setLockedToast(
                        "아직 잠금이 해제되지 않은 카드예요. 카운트다운이 끝나면 자동으로 열려요.",
                      );
                      return;
                    }
                    if (entry.candidate.is_blinded && entry.requires_payment) {
                      setPaymentTarget(entry.candidate);
                      return;
                    }
                    setActiveMatch(entry.candidate);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="px-[16px] pt-[16px] flex flex-col gap-[14px]">
          {threads === null && (
            <p className="mt-8 text-center text-[12px] text-white/50">
              채팅 목록을 불러오는 중...
            </p>
          )}
          {threads !== null && threads.length === 0 && (
            <div className="mt-12 flex flex-col items-center gap-3 text-center">
              <div className="text-[40px]">💌</div>
              <p className="text-[16px] font-semibold text-white">
                아직 진행 중인 대화가 없어요
              </p>
              <p className="text-[12px] leading-[18px] text-white/60">
                <span
                  className="cursor-pointer text-purple-300 underline underline-offset-2"
                  onClick={() => setTab("list")}
                >
                  매칭 리스트
                </span>
                에서 마음에 드는 상대를 골라
                <br />
                먼저 인사를 건네보세요!
              </p>
            </div>
          )}
          {threads?.map((t) => (
            <ChatThreadRow
              key={t.thread_id}
              thread={t}
              isOpen={openThreadId === t.thread_id}
              onOpenChange={(open) =>
                setOpenThreadId(open ? t.thread_id : null)
              }
              onClick={() => {
                // Pre-seed sessionStorage so the chat header shows the
                // peer's nickname immediately instead of "사용자 14" while
                // the fallback fetch resolves.
                sessionStorage.setItem(
                  "activeChat",
                  JSON.stringify({
                    user_id: t.peer.user_id,
                    nickname: t.peer.nickname,
                    photo_url: t.peer.photo_url,
                    score: 0,
                    age: null,
                    gender: null,
                    is_blinded: false,
                    birth_year: null,
                    dominant_element: null,
                    mbti: null,
                  } as MatchCandidate),
                );
                // Optimistically clear the badge for this row so the user
                // doesn't see stale unread numbers between navigation and
                // the chat room's mark-read call landing.
                setThreads((prev) =>
                  prev?.map((x) =>
                    x.thread_id === t.thread_id ? { ...x, unread_count: 0 } : x,
                  ) ?? prev,
                );
                router.push(`/matching/${t.peer.user_id}`);
              }}
              onLeave={() => handleLeaveThread(t)}
            />
          ))}
        </div>
      )}

      {activeMatch && (
        <MatchInfoModal
          candidate={activeMatch}
          onClose={() => setActiveMatch(null)}
          onOpenDetail={() => {
            router.push(`/profile/${activeMatch.user_id}`);
          }}
          onStartChat={() => {
            // Free users hit the payment modal first; paying flips is_paid
            // to true so the next /compatibility/matches call returns
            // is_blinded=false and the photos un-blur on return.
            if (!me?.is_paid) {
              setPaymentTarget(activeMatch);
              return;
            }
            sessionStorage.setItem("activeChat", JSON.stringify(activeMatch));
            router.push(`/matching/${activeMatch.user_id}`);
          }}
        />
      )}

      {paymentTarget && (
        <PaymentModal
          reason="chat"
          onClose={() => setPaymentTarget(null)}
          onPaid={() => {
            // Demo upgrade succeeded: locally mark paid, dismiss the modal
            // stack, and continue into the chat room.
            setMe((prev) => (prev ? { ...prev, is_paid: true } : prev));
            const target = paymentTarget;
            setPaymentTarget(null);
            setActiveMatch(null);
            sessionStorage.setItem("activeChat", JSON.stringify(target));
            router.push(`/matching/${target.user_id}`);
          }}
        />
      )}

      {/* Locked-card toast — pinned bottom-center, auto-dismiss. */}
      {lockedToast && (
        <div className="fixed bottom-[100px] left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/15 bg-black/70 px-[14px] py-[8px] text-[12px] text-white backdrop-blur-sm">
          {lockedToast}
        </div>
      )}
    </AppShell>
  );
}

function HistoryCard({
  entry,
  onOpen,
}: {
  entry: HistoryMatchEntry;
  onOpen: () => void;
}) {
  // is_locked is computed at fetch time; recompute here so a card the
  // user is staring at unlocks the moment its timer hits zero without
  // requiring a refetch.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const unlockMs = new Date(entry.unlock_at).getTime();
  const isLocked = now < unlockMs;

  if (isLocked) {
    const remaining = Math.max(0, unlockMs - now);
    const totalSec = Math.floor(remaining / 1000);
    const hh = Math.floor(totalSec / 3600);
    const mm = Math.floor((totalSec % 3600) / 60);
    const ss = totalSec % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return (
      <button
        type="button"
        onClick={onOpen}
        className="text-left transition active:scale-[0.98]"
      >
        <article className="relative aspect-[150/245] overflow-hidden rounded-[18px] border border-white/15 bg-gradient-to-br from-[#1f1235]/90 via-[#2a1648]/90 to-[#3a1c5e]/90 shadow-[0px_10px_20px_0px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <div className="flex h-full flex-col items-center justify-center gap-[10px] px-[10px] text-center">
            <div className="grid size-[44px] place-items-center rounded-full bg-white/10">
              <Lock className="size-[20px] stroke-white/85 stroke-[1.5]" />
            </div>
            <p className="text-[11px] text-white/65">곧 공개되는 인연</p>
            <p className="font-mono text-[16px] font-bold tabular-nums text-white">
              {pad(hh)}:{pad(mm)}:{pad(ss)}
            </p>
            <p className="text-[10px] text-white/55">
              {entry.match_basis === "jamidusu" ? "자미두수" : "사주"} 매칭
            </p>
          </div>
        </article>
      </button>
    );
  }

  const blinded = entry.candidate.is_blinded && entry.requires_payment;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative text-left transition active:scale-[0.98]"
    >
      <MatchCard data={entry.candidate} />
      {blinded && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-[6px] rounded-[18px] bg-black/55 backdrop-blur-[2px]">
          <div className="grid size-[36px] place-items-center rounded-full bg-[#fde047]/95 text-[#1b1029]">
            <Lock className="size-[16px] stroke-[2.5]" />
          </div>
          <p className="text-center text-[11px] font-bold text-[#fde047]">
            프리미엄
          </p>
          <p className="px-[10px] text-center text-[10px] leading-[14px] text-white/85">
            결제하고 자미두수
            <br />
            매칭 열어보기
          </p>
        </div>
      )}
    </button>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pb-[10px] text-center text-[20px] font-medium transition ${
        active ? "text-white" : "text-white/40"
      }`}
    >
      {label}
    </button>
  );
}