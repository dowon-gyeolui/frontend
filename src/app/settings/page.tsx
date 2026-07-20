"use client";
// 설정 허브 (/settings) — 흩어져 있던 항목(마이페이지·약관·FAQ·문의)을 한데 모은 리스트형 화면.
// 하단 네비의 톱니바퀴 탭으로 진입한다. 기존 진입점(우상단 마이페이지 아이콘 등)은 그대로 유지.

import {
  ChevronRight,
  FileText,
  MessageCircle,
  Shield,
  CircleQuestionMark,
  User,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";

// TODO(사용자): 카카오톡 채널/오픈채팅 실제 URL로 교체하세요.
const KAKAO_INQUIRY_URL = "https://pf.kakao.com/_TODO";

type IconType = ComponentType<{ className?: string }>;

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="flex-1 px-[20px] pb-[40px]">
        <div className="relative pt-[14px]">
          <h1 className="text-center text-[20px] font-bold text-white">설정</h1>
        </div>

        <div className="mt-[24px] space-y-[10px]">
          <SettingsRow icon={User} label="마이페이지" href="/mypage" />
          <SettingsRow icon={Shield} label="개인정보처리방침" href="/privacy" />
          <SettingsRow icon={FileText} label="이용약관" href="/terms" />
          <SettingsRow icon={CircleQuestionMark} label="FAQ" href="/settings/faq" />
          <SettingsRow
            icon={MessageCircle}
            label="문의하기"
            href={KAKAO_INQUIRY_URL}
            external
          />
        </div>
      </div>
    </AppShell>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  href,
  external,
}: {
  icon: IconType;
  label: string;
  href: string;
  external?: boolean;
}) {
  const inner: ReactNode = (
    <>
      <span className="grid size-[36px] shrink-0 place-items-center rounded-[10px] bg-white/10">
        <Icon className="size-[18px] stroke-[#fde047] stroke-[1.8]" />
      </span>
      <span className="flex-1 text-[15px] font-medium text-white">{label}</span>
      <ChevronRight className="size-[18px] shrink-0 stroke-white/40 stroke-[2]" />
    </>
  );

  const className =
    "flex w-full items-center gap-[12px] rounded-[14px] border border-white/15 bg-white/10 px-[16px] py-[14px] text-left backdrop-blur-sm hover:bg-white/15";

  if (external) {
    // Capacitor 셸에서도 외부 브라우저로 열리도록 target="_blank".
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}
