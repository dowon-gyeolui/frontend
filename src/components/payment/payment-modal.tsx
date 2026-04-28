"use client";

import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";

/**
 * Demo payment modal — overlays whatever the user was on (matching info
 * modal, /jamidusu page, etc.) when they hit a paid feature.
 *
 * Hits POST /users/me/upgrade-demo to toggle is_paid=true; real PG
 * (PortOne/Toss) replaces this when payment integration ships.
 */
export function PaymentModal({
  reason,
  onClose,
  onPaid,
}: {
  /** What the user was trying to do — drives the headline copy. */
  reason: "chat" | "jamidusu" | "general";
  onClose: () => void;
  /** Called after the demo upgrade succeeds. Caller decides where to go. */
  onPaid: () => void;
}) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !paying) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, paying]);

  const handlePay = async () => {
    if (paying) return;
    setPaying(true);
    setError(null);
    try {
      await apiFetch("/users/me/upgrade-demo", { method: "POST" });
      onPaid();
    } catch (e) {
      setError(e instanceof Error ? e.message : "결제 실패");
      setPaying(false);
    }
  };

  const headline =
    reason === "chat"
      ? "채팅을 시작하려면 프리미엄이 필요해요"
      : reason === "jamidusu"
        ? "자미두수 풀이는 프리미엄 전용이에요"
        : "프리미엄으로 업그레이드";

  const subtitle =
    reason === "chat"
      ? "결제하면 사진 블러가 풀리고 매칭된 인연과 자유롭게 대화할 수 있어요."
      : reason === "jamidusu"
        ? "1000년 전통 점성술 자미두수 12궁·14주성 풀이를 평생 열람할 수 있어요."
        : "채팅·자미두수·심층 풀이까지 모든 프리미엄 기능을 한 번에.";

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/65 backdrop-blur-[3px] px-[20px]"
      onClick={() => (paying ? null : onClose())}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[340px] overflow-hidden rounded-[20px] border-2 border-yellow-300/40 bg-gradient-to-br from-[#1a0d2e] via-[#2a0e4f] to-[#3d1d6e] p-[22px] shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          disabled={paying}
          className="absolute right-[14px] top-[14px] grid size-[24px] place-items-center"
        >
          <X className="size-[20px] stroke-white stroke-[2]" />
        </button>

        {/* Hero icon */}
        <div className="flex justify-center">
          <div className="grid size-[64px] place-items-center rounded-full bg-gradient-to-br from-yellow-300 to-pink-400 shadow-[0_0_30px_-2px_rgba(253,224,71,0.6)]">
            <Sparkles className="size-[32px] fill-white stroke-white" />
          </div>
        </div>

        <h2 className="mt-[16px] text-center text-[18px] font-bold text-white">
          {headline}
        </h2>
        <p className="mt-[8px] text-center text-[12px] leading-[18px] text-white/75">
          {subtitle}
        </p>

        {/* Pricing */}
        <div className="mt-[18px] rounded-[14px] border border-yellow-300/30 bg-white/5 p-[14px] text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#fde047]">
            ZAMI Premium
          </p>
          <p className="mt-[4px] text-[26px] font-bold text-white">9,900원</p>
          <p className="mt-[2px] text-[10px] text-white/55">월간 구독 · 언제든 해지</p>
        </div>

        {/* Demo notice */}
        <p className="mt-[10px] text-center text-[10px] leading-[14px] text-white/45">
          데모 기간에는 결제 없이 즉시 활성화됩니다.
          <br />
          정식 출시 후 카카오페이 / 토스페이먼츠로 결제 처리됩니다.
        </p>

        {error && (
          <p className="mt-[8px] text-center text-[11px] text-red-300">{error}</p>
        )}

        {/* CTAs */}
        <div className="mt-[16px] flex flex-col gap-[8px]">
          <button
            type="button"
            onClick={handlePay}
            disabled={paying}
            className="grid h-[46px] place-items-center rounded-[14px] text-[15px] font-bold text-[#1b1029] shadow-[0_0_15px_-3px_rgba(253,224,71,0.6)] disabled:opacity-50"
            style={{
              backgroundImage: "linear-gradient(95deg, #fde047 0%, #f472b6 100%)",
            }}
          >
            {paying ? "결제 처리 중..." : "9,900원 결제하기"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={paying}
            className="h-[40px] rounded-[12px] border border-white/15 bg-white/5 text-[13px] text-white/75 hover:bg-white/10 disabled:opacity-50"
          >
            나중에 하기
          </button>
        </div>
      </div>
    </div>
  );
}