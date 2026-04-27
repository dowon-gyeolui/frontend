"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { MatchCard, type MatchCandidate } from "@/components/matching/match-card";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Tab = "list" | "chat";

export default function MatchingPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("list");
  const [matches, setMatches] = useState<MatchCandidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    apiFetch<MatchCandidate[]>("/compatibility/matches?top_k=10")
      .then(setMatches)
      .catch((e: Error) => setError(e.message));
  }, [router]);

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
                  onClick={() => {
                    sessionStorage.setItem("activeChat", JSON.stringify(m));
                    router.push(`/matching/${m.user_id}`);
                  }}
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
          <p className="mt-2 text-center text-[12px] text-white/60">
            채팅방은 화요일 작업 중입니다.
            <br />
            현재는 매칭 카드를 클릭하면 임시 채팅방으로 이동합니다.
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