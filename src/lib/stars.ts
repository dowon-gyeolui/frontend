"use client";

/**
 * 스타 잔액 공유 상태.
 *
 * 잔액은 여러 화면(상단 칩·마이페이지·스토어·홈)에 노출되고, 충전/카드 열람
 * 으로 바뀐다. 매 화면이 따로 /users/me 를 폴링하지 않도록, 잔액이 바뀐 곳
 * (success 페이지, /matches/unlock 등)에서 notifyStarsChanged(newBalance) 를
 * 호출하면 구독 중인 모든 칩이 즉시 갱신된다.
 */

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

const STARS_CHANGED_EVENT = "zami:stars-changed";

type StarsChangedDetail = { balance: number };

/** 새 잔액을 알림 — 구독 중인 useStarBalance 들이 즉시 반영. */
export function notifyStarsChanged(balance: number): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<StarsChangedDetail>(STARS_CHANGED_EVENT, {
      detail: { balance },
    }),
  );
}

/**
 * 현재 사용자의 스타 잔액. 마운트 시 GET /users/me 로 한 번 읽고, 이후
 * notifyStarsChanged 이벤트로만 갱신(추가 네트워크 호출 없음). 비로그인/실패
 * 시 null.
 */
export function useStarBalance(): number | null {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    apiFetch<{ star_balance: number }>("/users/me")
      .then((me) => {
        if (!cancelled) setBalance(me.star_balance);
      })
      .catch(() => {
        /* soft-fail — 칩이 이번엔 표시 안 될 뿐 */
      });

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
