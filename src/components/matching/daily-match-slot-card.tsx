"use client";

import { Lock, Sparkles, Star } from "lucide-react";
import { useEffect, useState } from "react";

import {
  MatchCard,
  type MatchCandidate,
} from "@/components/matching/match-card";

export type SlotMatchBasis = "saju" | "jamidusu";

export type DailyMatchSlot = {
  slot_index: number;
  match_basis: SlotMatchBasis;
  candidate: MatchCandidate;
  assigned_at: string; // ISO
  unlock_at: string; // ISO
  is_locked: boolean;
  requires_payment: boolean;
};

/**
 * 오늘의 매칭 4-슬롯 카드 한 장.
 *
 * 슬롯 종류별 시각 분기:
 *   - is_locked (slot 2/3, 24h 카운트다운 진행 중): 자물쇠 + 카운트다운,
 *     클릭하면 onLockedClick 호출 (안내 토스트용).
 *   - requires_payment 이고 카드 candidate.is_blinded: 블러 사진 +
 *     "프리미엄 잠금 해제" CTA → onPaywallClick.
 *   - 그 외: 일반 매칭 카드, 클릭 시 onOpen.
 */
export function DailyMatchSlotCard({
  slot,
  onOpen,
  onPaywallClick,
  onLockedClick,
}: {
  slot: DailyMatchSlot;
  onOpen: () => void;
  onPaywallClick: () => void;
  onLockedClick?: () => void;
}) {
  const remaining = useCountdown(slot.unlock_at);
  const stillLocked = slot.is_locked && remaining > 0;

  // Outer wrapper handles the click. The locked / paywalled / open paths
  // go through different handlers but share the same card aspect ratio
  // so the 2×2 grid stays neat.
  const handleClick = () => {
    if (stillLocked) {
      onLockedClick?.();
      return;
    }
    if (slot.candidate.is_blinded && slot.requires_payment) {
      onPaywallClick();
      return;
    }
    onOpen();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="relative text-left transition active:scale-[0.98]"
    >
      {/* Slot label badge — sits above the card for context. */}
      <div className="absolute -top-[6px] left-[6px] z-10 flex items-center gap-[4px] rounded-full bg-[#211432] px-[8px] py-[2px] text-[10px] font-semibold text-white shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
        {slot.match_basis === "jamidusu" ? (
          <>
            <Star className="size-[10px] fill-[#fde047] stroke-[#fde047]" />
            <span className="text-[#fde047]">자미두수</span>
          </>
        ) : (
          <>
            <Sparkles className="size-[10px] stroke-[#a78bfa]" />
            <span>사주 무료</span>
          </>
        )}
      </div>

      {stillLocked ? (
        <LockedTeaser remainingMs={remaining} unlockAt={slot.unlock_at} />
      ) : (
        <div className="relative">
          <MatchCard data={slot.candidate} />
          {slot.candidate.is_blinded && slot.requires_payment && (
            <PaywallOverlay />
          )}
        </div>
      )}
    </button>
  );
}

function LockedTeaser({
  remainingMs,
  unlockAt,
}: {
  remainingMs: number;
  unlockAt: string;
}) {
  const { hh, mm, ss } = splitDuration(remainingMs);
  // unlockAt 의 실제 KST 시각을 읽어서 라벨 동적 생성.
  // 백엔드 anchor 정책이 정오(12:00) → 자정(00:00) 으로 바뀌었기 때문에
  // "정오에 열려요" 하드코딩하지 않고 실제 hour 로 분기.
  const unlockDate = new Date(unlockAt);
  const { dateLabel, timeLabel } = formatKstUnlock(unlockDate);
  return (
    <article className="relative aspect-[150/245] overflow-hidden rounded-[18px] border border-white/15 bg-gradient-to-br from-[#1f1235]/90 via-[#2a1648]/90 to-[#3a1c5e]/90 shadow-[0px_10px_20px_0px_rgba(0,0,0,0.35)] backdrop-blur-sm">
      <div className="flex h-full flex-col items-center justify-center gap-[10px] px-[10px] text-center">
        <div className="grid size-[44px] place-items-center rounded-full bg-white/8">
          <Lock className="size-[20px] stroke-white/85 stroke-[1.5]" />
        </div>
        <p className="text-[11px] text-white/65">곧 공개되는 인연</p>
        <p className="font-mono text-[16px] font-bold tabular-nums text-white">
          {pad2(hh)}:{pad2(mm)}:{pad2(ss)}
        </p>
        <p className="text-[10px] leading-[14px] text-white/55">
          {dateLabel}
          <br />
          {timeLabel}에 열려요
        </p>
      </div>
    </article>
  );
}

/**
 * unlockAt → (날짜라벨, 시각라벨) KST 기준.
 *
 * 시각라벨 규칙:
 *   - 0시  → "자정"
 *   - 12시 → "정오"
 *   - 그 외 → "오전 X시" / "오후 X시"
 *
 * 백엔드의 anchor 정책 (정오/자정/임의 시각) 가 바뀌어도 항상 사용자에게
 * 올바른 라벨을 보여주기 위해 unlockAt 자체의 hour 를 읽어서 분기.
 */
function formatKstUnlock(date: Date): { dateLabel: string; timeLabel: string } {
  const dateLabel = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
  }).format(date); // "5월 8일"

  // KST hour 추출 — Intl 의 hour12=false 로 0~23 가져옴.
  const hourStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    hour: "numeric",
    hour12: false,
  }).format(date); // "0", "12", "23" 등
  const hour = Number.parseInt(hourStr, 10);

  let timeLabel: string;
  if (hour === 0) timeLabel = "자정";
  else if (hour === 12) timeLabel = "정오";
  else if (hour < 12) timeLabel = `오전 ${hour}시`;
  else timeLabel = `오후 ${hour - 12}시`;

  return { dateLabel, timeLabel };
}

function PaywallOverlay() {
  return (
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
  );
}

// --- helpers ---------------------------------------------------------------

function useCountdown(targetIso: string): number {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, new Date(targetIso).getTime() - Date.now()),
  );

  useEffect(() => {
    const target = new Date(targetIso).getTime();
    const update = () => {
      setRemaining(Math.max(0, target - Date.now()));
    };
    update();
    // 1s tick is fine — the user only sees this card on /home, and the
    // tick stops driving renders the moment remaining hits 0.
    const handle = window.setInterval(update, 1000);
    return () => window.clearInterval(handle);
  }, [targetIso]);

  return remaining;
}

function splitDuration(ms: number): { hh: number; mm: number; ss: number } {
  const totalSec = Math.floor(ms / 1000);
  return {
    hh: Math.floor(totalSec / 3600),
    mm: Math.floor((totalSec % 3600) / 60),
    ss: totalSec % 60,
  };
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}