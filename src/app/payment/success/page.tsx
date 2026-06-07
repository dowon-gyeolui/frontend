"use client";

import { Star } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { confirmPayment, productByAmount } from "@/lib/payments";
import { notifyStarsChanged } from "@/lib/stars";

/**
 * /payment/success — 토스 결제 성공 리다이렉트 도착지.
 *
 * 토스가 successUrl 에 paymentKey/orderId/amount 를 쿼리로 붙여 보낸다.
 * 이 값으로 백엔드 confirm 을 호출해 최종 승인 + 스타 적립을 마친다.
 * (confirm 은 멱등이라 StrictMode 더블 호출/새로고침에도 안전.)
 */
function SuccessContent() {
  const router = useRouter();
  const params = useSearchParams();

  const paymentKey = params.get("paymentKey");
  const orderId = params.get("orderId");
  const amountRaw = params.get("amount");
  const amount = amountRaw !== null ? Number(amountRaw) : NaN;

  const [status, setStatus] = useState<"confirming" | "done" | "error">(
    "confirming",
  );
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const confirmedRef = useRef(false);

  const starAmount = Number.isFinite(amount)
    ? productByAmount(amount)?.stars ?? null
    : null;

  useEffect(() => {
    if (confirmedRef.current) return;
    confirmedRef.current = true;

    if (!paymentKey || !orderId || !Number.isFinite(amount)) {
      setStatus("error");
      setError("결제 정보가 올바르지 않습니다. 다시 시도해주세요.");
      return;
    }

    confirmPayment({ paymentKey, orderId, amount })
      .then((res) => {
        setBalance(res.star_balance);
        notifyStarsChanged(res.star_balance);
        setStatus("done");
      })
      .catch((e: Error) => {
        setError(e.message);
        setStatus("error");
      });
  }, [paymentKey, orderId, amount]);

  return (
    <AppShell>
      <div className="flex flex-1 flex-col items-center justify-center px-[24px] text-center">
        {status === "confirming" && (
          <>
            <div className="grid size-[64px] animate-pulse place-items-center rounded-full bg-gradient-to-br from-yellow-300 to-pink-400">
              <Star className="size-[32px] fill-white stroke-white" />
            </div>
            <p className="mt-[18px] text-[15px] text-white/85">
              결제를 확인하고 스타를 적립하는 중...
            </p>
          </>
        )}

        {status === "done" && (
          <>
            <div className="grid size-[72px] place-items-center rounded-full bg-gradient-to-br from-yellow-300 to-pink-400 shadow-[0_0_30px_-4px_rgba(253,224,71,0.7)]">
              <Star className="size-[36px] fill-white stroke-white" />
            </div>
            <h1 className="mt-[18px] text-[22px] font-bold text-white">
              {starAmount !== null
                ? `스타 ${starAmount.toLocaleString("ko-KR")}개 충전 완료!`
                : "스타 충전 완료!"}
            </h1>
            {balance !== null && (
              <p className="mt-[10px] text-[14px] text-white/80">
                현재 보유 스타{" "}
                <span className="font-bold text-[#fde047]">
                  {balance.toLocaleString("ko-KR")}개
                </span>
              </p>
            )}
            <p className="mt-[6px] text-[12px] text-white/55">
              별 10개로 인연 카드 1장을 추가로 열어볼 수 있어요.
            </p>

            <div className="mt-[28px] flex w-full max-w-[320px] flex-col gap-[10px]">
              <button
                type="button"
                onClick={() => router.replace("/home")}
                className="h-[50px] w-full rounded-[12px] bg-gradient-to-r from-yellow-300 to-pink-400 text-[16px] font-bold text-[#1b1029]"
              >
                인연 카드 보러가기 →
              </button>
              <button
                type="button"
                onClick={() => router.replace("/store")}
                className="h-[44px] w-full rounded-[12px] border border-white/15 bg-white/5 text-[14px] text-white/75 hover:bg-white/10"
              >
                더 충전하기
              </button>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-[20px] font-bold text-white">
              결제 확인에 실패했어요
            </h1>
            <p className="mt-[10px] text-[13px] leading-[20px] text-red-300">
              {error}
            </p>
            <p className="mt-[6px] text-[11px] text-white/50">
              스타가 적립되지 않았다면 다시 시도해주세요. 이미 적립됐다면 중복
              결제되지 않습니다.
            </p>
            <div className="mt-[24px] flex w-full max-w-[320px] flex-col gap-[10px]">
              <button
                type="button"
                onClick={() => router.replace("/store")}
                className="h-[50px] w-full rounded-[12px] bg-gradient-to-r from-yellow-300 to-pink-400 text-[16px] font-bold text-[#1b1029]"
              >
                스타 충전으로 돌아가기
              </button>
              <button
                type="button"
                onClick={() => router.replace("/home")}
                className="h-[44px] w-full rounded-[12px] border border-white/15 bg-white/5 text-[14px] text-white/75 hover:bg-white/10"
              >
                홈으로
              </button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function PaymentSuccessPage() {
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
      <SuccessContent />
    </Suspense>
  );
}
