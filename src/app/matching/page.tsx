"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { ChatThreadRow } from "@/components/matching/chat-thread-row";
import { MatchCard, type MatchCandidate } from "@/components/matching/match-card";
import { MatchInfoModal } from "@/components/matching/match-info-modal";
import { getToken } from "@/lib/auth";
import { leaveThread, listThreads, prefetchMessages, type ChatThreadSummary } from "@/lib/chat";
import { listUnlocked } from "@/lib/matches";

type Tab = "list" | "chat";

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
  // 열람한 인연 카드 = 채팅 가능한 상대 목록 (GET /matches).
  const [unlocked, setUnlocked] = useState<MatchCandidate[] | null>(null);
  const [threads, setThreads] = useState<ChatThreadSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeMatch, setActiveMatch] = useState<MatchCandidate | null>(null);
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

  // Auth + initial fetch of unlocked cards.
  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    listUnlocked()
      .then(setUnlocked)
      .catch((e: Error) => {
        setUnlocked([]);
        setError(e.message);
      });
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
            <div className="mt-6 text-center">
              <p className="text-sm text-red-300">인연을 불러오지 못했어요</p>
              <p className="mt-1 text-[11px] leading-[16px] text-white/45">
                일시적인 연결 문제일 수 있어요. 잠시 후 다시 시도해주세요.
              </p>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setUnlocked(null);
                  listUnlocked()
                    .then(setUnlocked)
                    .catch((e: Error) => {
                      setUnlocked([]);
                      setError(e.message);
                    });
                }}
                className="mt-3 rounded-full border border-white/20 bg-white/10 px-[16px] py-[6px] text-[13px] text-white hover:bg-white/15"
              >
                다시 시도
              </button>
            </div>
          )}
          {unlocked === null && !error && (
            <p className="mt-8 text-center text-[12px] text-white/50">
              인연을 불러오는 중...
            </p>
          )}
          {unlocked !== null && unlocked.length === 0 && (
            <div className="mt-8 text-center text-[12px] text-white/60">
              <p>아직 열람한 인연이 없어요</p>
              <p className="mt-1 text-white/40">
                홈 화면의 오늘의 인연부터 확인해보세요.
              </p>
            </div>
          )}
          {unlocked !== null && unlocked.length > 0 && (
            <>
              <p className="mb-[14px] text-center text-[11px] text-white/55">
                카드를 열람한 상대와 바로 채팅할 수 있어요.
              </p>
              <div className="grid grid-cols-2 gap-x-[16px] gap-y-[26px]">
                {unlocked.map((c) => (
                  <button
                    key={c.user_id}
                    type="button"
                    onClick={() => setActiveMatch(c)}
                    className="text-left transition active:scale-[0.98]"
                  >
                    <MatchCard data={c} />
                  </button>
                ))}
              </div>
            </>
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
                // Start fetching messages now so they arrive while Next.js
                // navigates — the chat page consumes this via consumePrefetch.
                prefetchMessages(t.peer.user_id);
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
            // 열람한 카드이므로 바로 채팅 가능.
            sessionStorage.setItem("activeChat", JSON.stringify(activeMatch));
            router.push(`/matching/${activeMatch.user_id}`);
          }}
        />
      )}
    </AppShell>
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
