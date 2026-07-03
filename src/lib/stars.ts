// 스타 잔액 공유 상태 — 여러 화면이 폴링 없이 즉시 갱신되도록 이벤트로 동기화.
"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

const STARS_CHANGED_EVENT = "zami:stars-changed";

type StarsChangedDetail = { balance: number };

export function notifyStarsChanged(balance: number): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<StarsChangedDetail>(STARS_CHANGED_EVENT, {
      detail: { balance },
    }),
  );
}

export function useStarBalance(): number | null {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    apiFetch<{ star_balance: number }>("/users/me")
      .then((me) => {
        if (!cancelled) setBalance(me.star_balance);
      })
      .catch(() => {});

    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<StarsChangedDetail>).detail;
      if (detail && typeof detail.balance === "number") setBalance(detail.balance);
    };
    window.addEventListener(STARS_CHANGED_EVENT, onChange);
    return () => {
      cancelled = true;
      window.removeEventListener(STARS_CHANGED_EVENT, onChange);
    };
  }, []);

  return balance;
}