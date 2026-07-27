// 스타 잔액 공유 상태 — 여러 화면이 폴링 없이 즉시 갱신되도록 이벤트로 동기화.
"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { CACHE_TTL, cacheGet, cacheSet } from "@/lib/cache";

const STARS_CHANGED_EVENT = "zami:stars-changed";
const STARS_CACHE_KEY = "stars:balance";

type StarsChangedDetail = { balance: number };

// 화면 전환(재마운트) 시 이전 잔액을 즉시 보여주기 위한 모듈 레벨 캐시.
// (SSR 에서는 사용하지 않아 요청 간 값이 섞이지 않는다 — 아래 useState 초기화 참고)
let lastBalance: number | null = null;

export function notifyStarsChanged(balance: number): void {
  lastBalance = balance;
  cacheSet(STARS_CACHE_KEY, balance);
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<StarsChangedDetail>(STARS_CHANGED_EVENT, {
      detail: { balance },
    }),
  );
}

export function useStarBalance(): number | null {
  // 클라이언트에서 이미 알고 있는 잔액이 있으면 즉시 표시(화면 전환 깜빡임 방지).
  // 서버 렌더에서는 null 로 고정해 사용자 간 값 혼선/하이드레이션 불일치를 막는다.
  const [balance, setBalance] = useState<number | null>(() =>
    typeof window === "undefined" ? null : lastBalance,
  );

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;

    // 새로고침 직후 등 모듈 캐시가 비어 있으면 localStorage 캐시로 즉시 채운다.
    if (lastBalance === null) {
      const cached = cacheGet<number>(STARS_CACHE_KEY, CACHE_TTL.short);
      if (cached !== null) {
        lastBalance = cached;
        setBalance(cached);
      }
    }

    // 최신 잔액으로 백그라운드 갱신.
    apiFetch<{ star_balance: number }>("/users/me")
      .then((me) => {
        if (cancelled) return;
        lastBalance = me.star_balance;
        cacheSet(STARS_CACHE_KEY, me.star_balance);
        setBalance(me.star_balance);
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
