"use client";

import { Star } from "lucide-react";
import Link from "next/link";

import { useStarBalance } from "@/lib/stars";

/**
 * 상단바에 노출되는 보유 스타 칩. 탭하면 /store(충전) 로 이동.
 * 잔액을 아직 못 읽었으면(null) 렌더하지 않아 레이아웃이 흔들리지 않게 한다.
 */
export function StarBalancePill() {
  const balance = useStarBalance();
  if (balance === null) return null;

  return (
    <Link
      href="/store"
      aria-label={`보유 스타 ${balance}개 · 충전하기`}
      className="flex items-center gap-[4px] rounded-full border border-[#fde047]/40 bg-[#fde047]/10 px-[10px] py-[3px] text-[12px] font-bold text-[#fde047]"
    >
      <Star className="size-[13px] fill-[#fde047] stroke-[#fde047]" />
      {balance.toLocaleString("ko-KR")}
    </Link>
  );
}
