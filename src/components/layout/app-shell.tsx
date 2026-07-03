"use client";
// 온보딩 이후 화면 공통 레이아웃 — 상단 바 + 하단 네비게이션 shell.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Sparkles, User } from "lucide-react";
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

      <nav className="fixed bottom-[20px] left-1/2 z-10 flex h-[65px] w-[212px] -translate-x-1/2 items-center justify-around rounded-full border border-[#4b3270] bg-[#211432] px-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          const showDot = item.href === "/matching" && unreadTotal > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center gap-[2px]"
            >
              <Icon
                className={`size-[20px] ${active ? "stroke-[#fde047]" : "stroke-[#8d7aae]"}`}
                fill={active ? "#fde047" : "none"}
                strokeWidth={active ? 0 : 2}
              />
              {showDot && (
                <span
                  aria-label="새 메시지 있음"
                  className="absolute -top-[2px] right-[2px] size-[8px] rounded-full bg-[#ff5f5f] shadow-[0_0_6px_rgba(255,95,95,0.7)]"
                />
              )}
              <span
                className={`text-[13px] ${active ? "font-bold text-[#fde047]" : "text-[#8d7aae]"}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}