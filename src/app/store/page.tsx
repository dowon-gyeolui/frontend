"use client";
// 스타 충전 페이지 (/store) — 토스 결제 패키지 선택 및 테스트 충전

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { isTossConfigured } from "@/lib/config";
import { notifyStarsChanged } from "@/lib/stars";
import {
  STAR_PRODUCTS,
  customerKeyFor,
  startStarCheckout,
  type StarProduct,
} from "@/lib/payments";

type Me = { id: number; star_balance: number };

export default function StorePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    apiFetch<Me>("/users/me")
      .then(setMe)
      .catch(() => {});
  }, [router]);

  const buy = async (product: StarProduct) => {
    if (pendingId) return;
    if (!isTossConfigured()) {
      setError(
        "결제 설정이 완료되지 않았어요. 관리자에게 문의해주세요. (토스 클라이언트 키 미설정)",
      );
      return;
    }
    setError(null);
    setPendingId(product.product_id);
    try {
      await startStarCheckout(product.product_id, customerKeyFor(me?.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "결제를 시작하지 못했어요.");
      setPendingId(null);
    }
  };

  const testTopup = async () => {
    if (testing) return;
    setError(null);
    setTesting(true);
    try {
      const res = await apiFetch<{ star_balance: number }>(
        "/payments/test-topup",
        { method: "POST" },
      );
      setMe((prev) => (prev ? { ...prev, star_balance: res.star_balance } : prev));
      notifyStarsChanged(res.star_balance);
    } catch (e) {
      setError(e instanceof Error ? e.message : "테스트 충전에 실패했어요.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <AppShell>
      <div className="flex-1 px-[20px] pb-[40px]">
        <div className="relative pt-[14px]">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="뒤로 가기"
            className="absolute left-0 top-[14px]"
          >
            <ArrowLeft className="size-[24px] stroke-white stroke-[2]" />
          </button>
          <h1 className="text-center text-[20px] font-bold text-white">
            별 충전
          </h1>
          <div className="mt-[10px] h-px bg-white/30" />
        </div>

        <section className="mt-[20px] rounded-[18px] border border-yellow-300/40 bg-gradient-to-br from-[#fde047]/15 to-[#a78bfa]/10 p-[18px] text-center backdrop-blur-sm">
          <p className="text-[12px] text-white/70">현재 보유 별</p>
          <div className="mt-[6px] flex items-center justify-center gap-[8px]">
            <span className="text-[32px] font-bold text-white">
              {me ? me.star_balance.toLocaleString("ko-KR") : "—"}
            </span>
          </div>
          <p className="mt-[6px] text-[11px] text-white/55">
            별 10개로 인연 카드 1장을 추가로 열어볼 수 있어요.
          </p>
        </section>

        <section className="mt-[24px] space-y-[12px]">
          {STAR_PRODUCTS.map((p) => (
            <PackageCard
              key={p.product_id}
              product={p}
              pending={pendingId === p.product_id}
              disabled={pendingId !== null && pendingId !== p.product_id}
              onBuy={() => buy(p)}
            />
          ))}
        </section>

        {error && (
          <p className="mt-[16px] text-center text-[12px] text-red-300">{error}</p>
        )}

        {!isTossConfigured() && (
          <section className="mt-[24px] rounded-[18px] border border-dashed border-white/30 bg-white/5 p-[16px] text-center">
            <p className="text-[12px] font-semibold text-white/80">
              테스트 모드
            </p>
            <p className="mt-[4px] text-[11px] text-white/55">
              토스페이먼츠 연결 전, 결제 없이 스타를 충전해 카드 열람·스와이프를
              테스트할 수 있어요. (연결되면 자동으로 사라져요)
            </p>
            <button
              type="button"
              onClick={testTopup}
              disabled={testing}
              className="mx-auto mt-[12px] block w-fit rounded-full bg-white/15 px-[18px] py-[8px] text-[13px] font-bold text-white disabled:opacity-50"
            >
              {testing ? "충전 중..." : "테스트 충전 +100"}
            </button>
          </section>
        )}

      </div>
    </AppShell>
  );
}

function PackageCard({
  product,
  pending,
  disabled,
  onBuy,
}: {
  product: StarProduct;
  pending: boolean;
  disabled: boolean;
  onBuy: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onBuy}
      disabled={pending || disabled}
      className={`flex w-full items-center justify-between rounded-[18px] border p-[16px] text-left transition active:scale-[0.99] disabled:opacity-50 ${
        product.featured
          ? "border-2 border-yellow-300/60 bg-gradient-to-br from-yellow-300/15 to-pink-400/10 shadow-[0_0_18px_-6px_rgba(253,224,71,0.5)]"
          : "border border-white/20 bg-white/5"
      }`}
    >
      <div className="flex items-center gap-[14px]">
        <div>
          <div className="flex items-center gap-[6px]">
            <p className="text-[17px] font-bold text-white">
              별 {product.stars.toLocaleString("ko-KR")}개
            </p>
            {product.featured && (
              <span className="rounded-full bg-[#fde047] px-[7px] py-[1px] text-[10px] font-bold text-[#1b1029]">
                추천
              </span>
            )}
          </div>
          <p className="mt-[2px] text-[11px] text-white/60">
            인연 카드 {product.cards}장 {product.note}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-[16px] font-bold text-[#fde047]">
          {product.price.toLocaleString("ko-KR")}원
        </p>
        {pending && (
          <p className="mt-[2px] text-[11px] text-white/60">결제창 여는 중...</p>
        )}
      </div>
    </button>
  );
}
