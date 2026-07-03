"use client";
// 인연 카드 추가 열람 팝업 — 보유 스타 표시 + 열람 수량 선택기.

import { Minus, Plus, Star, X } from "lucide-react";
import { useEffect, useState } from "react";

const STAR_COST_PER_CARD = 10;

export function UnlockModal({
  balance,
  maxCount,
  onConfirm,
  onClose,
  busy = false,
}: {
  balance: number;
  maxCount: number;
  onConfirm: (count: number) => void;
  onClose: () => void;
  busy?: boolean;
}) {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const clamp = (n: number) => Math.max(1, Math.min(maxCount, n));
  const cost = count * STAR_COST_PER_CARD;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(27,16,41,0.5)] backdrop-blur-[2px] p-[20px]"
      onClick={busy ? undefined : onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-[320px] max-w-full rounded-[18px] border border-white/15 bg-[#241338] p-[20px] shadow-[0_10px_40px_rgba(0,0,0,0.45)]"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="닫기"
          className="absolute right-[12px] top-[12px] grid size-[24px] place-items-center disabled:opacity-40"
        >
          <X className="size-[20px] stroke-white stroke-[2]" />
        </button>

        <h3 className="text-center text-[17px] font-bold text-white">
          인연 카드 추가 열람
        </h3>

        <div className="mt-[14px] flex items-center justify-center gap-[6px] text-white/80">
          <span className="text-[13px]">보유 스타</span>
          <Star className="size-[16px] fill-[#fde047] stroke-[#fde047]" />
          <span className="text-[16px] font-bold text-white">
            {balance.toLocaleString("ko-KR")}
          </span>
        </div>

        <div className="mt-[18px]">
          <p className="text-center text-[12px] text-white/55">
            몇 장 더 열람할까요?
          </p>
          <div className="mt-[10px] flex items-center justify-center gap-[18px]">
            <button
              type="button"
              onClick={() => setCount((c) => clamp(c - 1))}
              disabled={busy || count <= 1}
              aria-label="줄이기"
              className="grid size-[40px] place-items-center rounded-full border border-white/20 text-white disabled:opacity-30"
            >
              <Minus className="size-[18px] stroke-white stroke-[2.5]" />
            </button>
            <span className="min-w-[48px] text-center text-[30px] font-bold text-white">
              {count}
            </span>
            <button
              type="button"
              onClick={() => setCount((c) => clamp(c + 1))}
              disabled={busy || count >= maxCount}
              aria-label="늘리기"
              className="grid size-[40px] place-items-center rounded-full border border-white/20 text-white disabled:opacity-30"
            >
              <Plus className="size-[18px] stroke-white stroke-[2.5]" />
            </button>
          </div>
          <p className="mt-[8px] text-center text-[11px] text-white/45">
            최대 {maxCount}장까지 열람할 수 있어요
          </p>
        </div>

        <div className="mt-[16px] flex items-center justify-center gap-[6px] rounded-[10px] bg-white/5 py-[10px] text-[13px] text-white/85">
          <span>차감</span>
          <Star className="size-[15px] fill-[#fde047] stroke-[#fde047]" />
          <span className="font-bold text-[#fde047]">{cost}</span>
        </div>

        <button
          type="button"
          onClick={() => onConfirm(count)}
          disabled={busy || maxCount < 1}
          className="mt-[16px] h-[48px] w-full rounded-[12px] text-[15px] font-bold text-white shadow-[0_0_8px_2px_#7f55b4] disabled:opacity-50"
          style={{
            backgroundImage:
              "linear-gradient(97deg, rgb(124, 58, 237) 0%, rgb(168, 85, 247) 100%)",
          }}
        >
          {busy ? "여는 중..." : `${count}장 열람하기`}
        </button>
      </div>
    </div>
  );
}