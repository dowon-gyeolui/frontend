"use client";

import { XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { AppShell } from "@/components/layout/app-shell";

/**
 * /payment/fail — 토스 결제 실패/취소 리다이렉트 도착지.
 * 토스가 failUrl 에 code/message/orderId 를 쿼리로 붙여 보낸다.
 */
function FailContent() {
  const router = useRouter();
  const params = useSearchParams();

  const message = params.get("message");
  const code = params.get("code");

  return (
    <AppShell>
      <div className="flex flex-1 flex-col items-center justify-center px-[24px] text-center">
        <div className="grid size-[64px] place-items-center rounded-full bg-red-500/15">
          <XCircle className="size-[36px] stroke-red-300 stroke-[1.5]" />
        </div>
        <h1 className="mt-[18px] text-[20px] font-bold text-white">
          결제가 완료되지 않았어요
        </h1>
        <p className="mt-[10px] text-[13px] leading-[20px] text-white/80">
          {message ?? "결제가 취소되었거나 처리 중 문제가 발생했어요."}
        </p>
        {code && <p className="mt-[6px] text-[11px] text-white/40">오류 코드: {code}</p>}
        <p className="mt-[8px] text-[12px] text-white/55">
          결제는 진행되지 않았으니 안심하세요. 다시 시도할 수 있어요.
        </p>

        <div className="mt-[28px] flex w-full max-w-[320px] flex-col gap-[10px]">
          <button
            type="button"
            onClick={() => router.replace("/store")}
            className="h-[50px] w-full rounded-[12px] bg-gradient-to-r from-yellow-300 to-pink-400 text-[16px] font-bold text-[#1b1029]"
          >
            다시 시도하기
          </button>
          <button
            type="button"
            onClick={() => router.replace("/home")}
            className="h-[44px] w-full rounded-[12px] border border-white/15 bg-white/5 text-[14px] text-white/75 hover:bg-white/10"
          >
            홈으로
          </button>
        </div>
      </div>
    </AppShell>
  );
}

export default function PaymentFailPage() {
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
      <FailContent />
    </Suspense>
  );
}
