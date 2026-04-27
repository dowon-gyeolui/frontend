"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Sparkles, User } from "lucide-react";
import type { ReactNode } from "react";

import { ZamiLogo } from "@/components/brand/zami-logo";

/**
 * Top + bottom chrome shared across the post-onboarding screens (Home,
 * Matching, Saju, Mypage). Children render between the two bars.
 */
type AppShellProps = {
  children: ReactNode;
  /**
   * Optional yellow chip rendered to the left of the user icon. Used on the
   * home screen to invite the user to finish filling out their profile.
   */
  topChip?: ReactNode;
};

const NAV_ITEMS = [
  { href: "/matching", label: "매칭", icon: MessageCircle },
  { href: "/home", label: "홈", icon: Home },
  { href: "/saju", label: "사주", icon: Sparkles },
] as const;

export function AppShell({ children, topChip }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div
      className="relative flex min-h-dvh w-full flex-1 flex-col overflow-hidden"
      style={{
        background:
          "linear-gradient(to bottom, #12081f 0%, #2a0e4f 50%, #5e35b1 100%)",
      }}
    >
      {/* Top bar */}
      <div className="relative pt-[39px]">
        <div className="flex items-center justify-between px-[24px]">
          <Link href="/home" aria-label="홈으로">
            <ZamiLogo size="sm" />
          </Link>
          <div className="flex items-center gap-[10px]">
            {topChip}
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

      {/* Content */}
      <div className="flex flex-1 flex-col pb-[100px]">{children}</div>

      {/* Bottom nav (pill) */}
      <nav className="fixed bottom-[20px] left-1/2 z-10 flex h-[65px] w-[212px] -translate-x-1/2 items-center justify-around rounded-full border border-[#4b3270] bg-[#211432] px-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-[2px]"
            >
              <Icon
                className={`size-[20px] ${active ? "stroke-[#fde047]" : "stroke-[#8d7aae]"}`}
                fill={active ? "#fde047" : "none"}
                strokeWidth={active ? 0 : 2}
              />
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