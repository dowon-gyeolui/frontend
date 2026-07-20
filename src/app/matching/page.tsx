"use client";
// 매칭 리스트 / 채팅 목록 탭 페이지 (/matching)

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { ChatThreadRow } from "@/components/matching/chat-thread-row";
import { MatchCard, type MatchCandidate } from "@/components/matching/match-card";
import { MatchInfoModal } from "@/components/matching/match-info-modal";
import { getToken } from "@/lib/auth";
import { CACHE_TTL, swrCache } from "@/lib/cache";
import { leaveThread, listThreads, prefetchMessages, type ChatThreadSummary } from "@/lib/chat";
import { listUnlocked } from "@/lib/matches";

type Tab = "list" | "chat";

export default function MatchingPage() {
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
  const initialTab: Tab = params.get("tab") === "chat" ? "chat" : "list";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [unlocked, setUnlocked] = useState<MatchCandidate[] | null>(null);
  const [threads, setThreads] = useState<ChatThreadSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeMatch, setActiveMatch] = useState<MatchCandidate | null>(null);
  const [openThreadId, setOpenThreadId] = useState<number | null>(null);

  const handleLeaveThread = async (t: ChatThreadSummary) => {
    if (!confirm(`${t.peer.nickname ?? "이 채팅"} 방에서 나가시겠어요?\n나간 후에는 더 이상 보이지 않아요.`)) {
      return;
    }
    setThreads((prev) => prev?.filter((x) => x.thread_id !== t.thread_id) ?? prev);
    setOpenThreadId(null);
    try {
      await leaveThread(t.thread_id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "채팅방 나가기 실패");
      listThreads().then(setThreads).catch(() => {});
    }
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    // 캐시 히트 시 즉시 렌더 → 백그라운드 갱신. 캐시 미스/에러 시 기존 에러 경로 유지.
    swrCache<MatchCandidate[]>(
      "/matches",
      CACHE_TTL.matches,
      listUnlocked,
      setUnlocked,
      {
        onError: (e) => {
          setUnlocked([]);
          setError(e.message);
        },
      },
    );
  }, [router]);

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
                  swrCache<MatchCandidate[]>(
                    "/matches",
                    CACHE_TTL.matches,
                    listUnlocked,
                    setUnlocked,
                    {
                      onError: (e) => {
                        setUnlocked([]);
                        setError(e.message);
                      },
                    },
                  );
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
                setThreads((prev) =>
                  prev?.map((x) =>
                    x.thread_id === t.thread_id ? { ...x, unread_count: 0 } : x,
                  ) ?? prev,
                );
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
