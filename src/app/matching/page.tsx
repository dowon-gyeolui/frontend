"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { MOCK_MATCH_CARDS, MatchCard } from "@/components/matching/match-card";

type Tab = "list" | "chat";

// Mock chat threads — keyed off MOCK_MATCH_CARDS so opening a chat from
// either tab lands on the same thread id.
const MOCK_CHATS = MOCK_MATCH_CARDS.slice(0, 5).map((c, idx) => ({
  id: c.id,
  name: c.name,
  photo: c.photo,
  lastMessage: ["오늘은 뭐해?", "떡볶이 먹고 싶다", "어디 아파?", "자라.", "그럼 내일 보는 걸로 할까?"][
    idx
  ],
  unread: idx < 2, // first two have unread badges
}));

export default function MatchingPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("list");

  return (
    <AppShell>
      {/* Tabs */}
      <div className="relative grid grid-cols-2 px-[20px] pt-[14px]">
        <TabButton label="매칭 리스트" active={tab === "list"} onClick={() => setTab("list")} />
        <div className="absolute inset-y-[14px] left-1/2 w-px bg-white/40" />
        <TabButton label="채팅" active={tab === "chat"} onClick={() => setTab("chat")} />
      </div>

      {tab === "list" ? (
        <div className="px-[20px] pt-[18px]">
          <div className="grid grid-cols-2 gap-[16px]">
            {MOCK_MATCH_CARDS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => router.push(`/matching/${c.id}`)}
                className="text-left transition active:scale-[0.98]"
              >
                <MatchCard data={c} />
              </button>
            ))}
          </div>
          <p className="mt-6 text-center text-[10px] text-white/40">
            ※ 백엔드 매칭 API 연동 전 — 임시 카드입니다
          </p>
        </div>
      ) : (
        <div className="px-[16px] pt-[16px] flex flex-col gap-[14px]">
          {MOCK_CHATS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => router.push(`/matching/${c.id}`)}
              className="relative h-[86px] w-full overflow-hidden rounded-[10px] text-left shadow-[0px_4px_15px_-4px_rgba(168,85,247,0.4)] transition active:scale-[0.99]"
              style={{
                backgroundImage:
                  "linear-gradient(96deg, rgb(124, 58, 237) 0%, rgb(168, 85, 247) 100%)",
              }}
            >
              {c.unread && (
                <span className="absolute right-[8px] top-[6px] size-[12px] rounded-full bg-red-500 ring-2 ring-purple-300/50" />
              )}
              <div className="flex h-full items-center gap-[12px] px-[14px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.photo}
                  alt={c.name}
                  className="size-[58px] flex-shrink-0 rounded-full border border-white/20 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[20px] font-bold text-white">{c.name}</p>
                  <p className="truncate text-[15px] text-white/95">
                    {c.lastMessage}
                  </p>
                </div>
              </div>
            </button>
          ))}
          <p className="mt-2 text-center text-[10px] text-white/40">
            ※ 백엔드 채팅 API 연동 전 — 임시 데이터
          </p>
        </div>
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