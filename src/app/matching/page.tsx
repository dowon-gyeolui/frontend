"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { MatchCard, type MatchCandidate } from "@/components/matching/match-card";
import { MatchInfoModal } from "@/components/matching/match-info-modal";
import { PaymentModal } from "@/components/payment/payment-modal";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { listThreads, type ChatThreadSummary } from "@/lib/chat";

type Me = { id: number; is_paid: boolean };

type Tab = "list" | "chat";

const PLACEHOLDER_PHOTO =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop";

export default function MatchingPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("list");
  const [matches, setMatches] = useState<MatchCandidate[] | null>(null);
  const [threads, setThreads] = useState<ChatThreadSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeMatch, setActiveMatch] = useState<MatchCandidate | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  // When set, the payment modal is shown on top of MatchInfoModal. The
  // candidate is remembered so we can navigate to their chat after payment.
  const [paymentTarget, setPaymentTarget] = useState<MatchCandidate | null>(null);

  // Auth + initial fetch (matches always; threads only when chat tab opened)
  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    apiFetch<Me>("/users/me")
      .then(setMe)
      .catch(() => {});
    apiFetch<MatchCandidate[]>("/compatibility/matches?top_k=10")
      .then(setMatches)
      .catch((e: Error) => setError(e.message));
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
              매칭 후보를 불러오지 못했어요: {error}
            </p>
          )}
          {matches === null && !error && (
            <p className="mt-8 text-center text-[12px] text-white/50">
              매칭 후보를 분석 중...
            </p>
          )}
          {matches !== null && matches.length === 0 && (
            <div className="mt-8 text-center text-[12px] text-white/60">
              <p>아직 매칭 가능한 상대가 없어요</p>
              <p className="mt-1 text-white/40">
                생년월일을 입력한 다른 사용자가 가입하면 표시됩니다.
              </p>
            </div>
          )}
          {matches !== null && matches.length > 0 && (
            <div className="grid grid-cols-2 gap-[16px]">
              {matches.map((m) => (
                <button
                  key={m.user_id}
                  type="button"
                  onClick={() => setActiveMatch(m)}
                  className="text-left transition active:scale-[0.98]"
                >
                  <MatchCard data={m} />
                </button>
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
            <button
              key={t.thread_id}
              type="button"
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
                router.push(`/matching/${t.peer.user_id}`);
              }}
              className="relative h-[86px] w-full overflow-hidden rounded-[10px] text-left shadow-[0px_4px_15px_-4px_rgba(168,85,247,0.4)] transition active:scale-[0.99]"
              style={{
                backgroundImage:
                  "linear-gradient(96deg, rgb(124, 58, 237) 0%, rgb(168, 85, 247) 100%)",
              }}
            >
              <div className="flex h-full items-center gap-[12px] px-[14px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.peer.photo_url ?? PLACEHOLDER_PHOTO}
                  alt={t.peer.nickname ?? ""}
                  className="size-[58px] flex-shrink-0 rounded-full border border-white/20 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[20px] font-bold text-white">
                    {t.peer.nickname ?? "익명"}
                  </p>
                  <p className="truncate text-[15px] text-white/95">
                    {t.last_message?.content ?? "대화를 시작해보세요"}
                  </p>
                </div>
              </div>
            </button>
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