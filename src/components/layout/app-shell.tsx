"use client";
// 온보딩 이후 화면 공통 레이아웃 — 상단 바 + 하단 네비게이션 shell.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Settings, Sparkles, User } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { ZamiLogo } from "@/components/brand/zami-logo";
import { StarBalancePill } from "@/components/payment/star-balance";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type AppShellProps = {
  children: ReactNode;
  topChip?: ReactNode;
};

const NAV_ITEMS = [
  { href: "/matching", label: "매칭", icon: MessageCircle },
  { href: "/home", label: "홈", icon: Home },
  { href: "/saju", label: "사주", icon: Sparkles },
  { href: "/settings", label: "설정", icon: Settings },
] as const;

const UNREAD_POLL_MS = 30_000;

function useUnreadTotal(): number {
  const [total, setTotal] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;

    const tick = () => {
      apiFetch<{ total_unread: number }>("/chat/unread-summary")
        .then((r) => {
          if (!cancelled) setTotal(r.total_unread);
        })
        .catch(() => {
        });
    };

    tick();
    const handle = window.setInterval(tick, UNREAD_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, [pathname]);

  return total;
}

export function AppShell({ children, topChip }: AppShellProps) {
  const pathname = usePathname();
  const unreadTotal = useUnreadTotal();
  // usePathname() 기반 활성 판정 — 서버/클라 동일 값이라 하이드레이션 불일치 없음.
  const activeIndex = NAV_ITEMS.findIndex((item) => pathname === item.href);

  return (
    <div
      className="relative flex min-h-dvh w-full flex-1 flex-col overflow-hidden"
      style={{
        background:
          "linear-gradient(to bottom, #12081f 0%, #2a0e4f 50%, #5e35b1 100%)",
      }}
    >
      <div className="relative pt-[39px]">
        <div className="flex items-center justify-between px-[24px]">
          <Link href="/home" aria-label="홈으로">
            <ZamiLogo size="sm" />
          </Link>
          <div className="flex items-center gap-[10px]">
            {topChip}
            <StarBalancePill />
            <Link
              href="/mypage"
              aria-label="마이페이지"
              className="grid size-[25px] place-items-center"
            >
              <User className="size-[25px] stroke-white stroke-[1.5]" />
            </Link>
          </div>
        </div>
        <div className="mt-[14px] h-px bg-white/40" />
      </div>

      <div className="flex flex-1 flex-col pb-[100px]">{children}</div>

      <nav className="fixed bottom-[20px] left-1/2 z-10 flex h-[65px] w-[280px] -translate-x-1/2 items-center justify-around rounded-full border border-[#4b3270] bg-[#211432] px-2">
        <div className="relative flex h-full w-full items-center">
          {/* 활성 탭 위치로 스르륵 이동하는 하이라이트 인디케이터 (4개 탭 기준 1/4 폭). */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-[9px] left-0 w-1/4 rounded-full bg-[#fde047]/10 ring-1 ring-inset ring-[#fde047]/20 transition-all duration-300 ease-out motion-reduce:transition-none"
            style={{
              transform: `translateX(${activeIndex < 0 ? 0 : activeIndex * 100}%)`,
              opacity: activeIndex < 0 ? 0 : 1,
            }}
          />
          {NAV_ITEMS.map((item, index) => {
            const active = index === activeIndex;
            const Icon = item.icon;
            const showDot = item.href === "/matching" && unreadTotal > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative z-10 flex flex-1 flex-col items-center justify-center gap-[2px]"
              >
                <Icon
                  className={`size-[20px] transition-all duration-300 ease-out motion-reduce:transition-none ${
                    active
                      ? "scale-110 fill-[#fde047] stroke-[#fde047]"
                      : "scale-100 fill-transparent stroke-[#8d7aae]"
                  }`}
                />
                {showDot && (
                  <span
                    aria-label="새 메시지 있음"
                    className="absolute -top-[2px] right-[2px] size-[8px] rounded-full bg-[#ff5f5f] shadow-[0_0_6px_rgba(255,95,95,0.7)]"
                  />
                )}
                <span
                  className={`text-[13px] transition-colors duration-300 ease-out ${
                    active ? "font-bold text-[#fde047]" : "text-[#8d7aae]"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}