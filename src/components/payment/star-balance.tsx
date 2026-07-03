"use client";
// 역할 설명: 상단바에 보유 별(스타) 잔액을 표시하고 탭 시 스토어로 이동하는 칩

import { Star } from "lucide-react";
import Link from "next/link";

import { useStarBalance } from "@/lib/stars";

export function StarBalancePill() {
  const balance = useStarBalance();
  if (balance === null) return null;

  return (
    <Link
      href="/store"
      aria-label={`보유 별 ${balance}개 · 충전하기`}
      className="flex items-center gap-[4px] rounded-full border border-[#fde047]/40 bg-[#fde047]/10 px-[10px] py-[3px] text-[12px] font-bold text-[#fde047]"
    >
      <Star className="size-[13px] fill-[#fde047] stroke-[#fde047]" />
      {balance.toLocaleString("ko-KR")}
    </Link>
  );
}
