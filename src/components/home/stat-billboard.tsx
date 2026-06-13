"use client";

import { Radio } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CACHE_TTL, fetchWithCache } from "@/lib/cache";

/** GET /stats/home 응답. 백엔드 HomeStats 스키마 미러. */
type HomeStats = {
  signups_total: number;
  signups_today: number;
  gender: { male: number; female: number };
  active_chat_rooms: number;
  today_matches: number;
  active_users: number;
  same_day_stem: { stem: string; count: number } | null;
  same_element: { element: string; count: number } | null;
};

/**
 * 회전 문구 정의 — 전광판에 띄울 문구들을 한곳에서 관리한다.
 * 각 항목은 stats 를 받아 문구를 만들고, 노출 가치가 없으면(예: 0명)
 * null 을 돌려준다. 새 문구를 실험하려면 여기 배열에 한 줄 추가하면 된다.
 */
const MESSAGES: ((s: HomeStats) => string | null)[] = [
  (s) =>
    s.signups_total > 0
      ? `지금까지 ${s.signups_total.toLocaleString()}명이 ZAMI와 인연을 찾고 있어요`
      : null,
  (s) => (s.active_users > 0 ? `지금 ${s.active_users}명이 활동 중이에요` : null),
  (s) =>
    s.signups_today > 0 ? `오늘 ${s.signups_today}명이 새로 합류했어요` : null,
  (s) =>
    s.today_matches > 0 ? `오늘 ${s.today_matches}건의 인연이 연결됐어요` : null,
  (s) =>
    s.active_chat_rooms > 0
      ? `${s.active_chat_rooms}개의 대화가 이어지고 있어요`
      : null,
  (s) => {
    const total = s.gender.male + s.gender.female;
    if (total <= 0) return null;
    const mp = Math.round((s.gender.male / total) * 100);
    return `현재 회원 성비 — 남 ${mp}% · 여 ${100 - mp}%`;
  },
  (s) =>
    s.same_day_stem && s.same_day_stem.count > 0
      ? `나와 같은 일간(${s.same_day_stem.stem})을 가진 회원이 ${s.same_day_stem.count}명 있어요`
      : null,
  (s) =>
    s.same_element && s.same_element.count > 0
      ? `나와 같은 ${s.same_element.element} 기운의 회원이 ${s.same_element.count}명 있어요`
      : null,
];

// 문구 교체 주기(ms).
const ROTATE_MS = 4000;
// 페이드 전환 시간(ms) — Tailwind duration-300 과 맞춤.
const FADE_MS = 300;

export function StatBillboard() {
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    fetchWithCache<HomeStats>("/stats/home", CACHE_TTL.short, setStats, {
      onError: () => setStats(null),
    });
  }, []);

  // stats 로 실제 노출할 문구 리스트를 만든다(0 값 문구 제거).
  const lines = useMemo(() => {
    if (!stats) return [] as string[];
    return MESSAGES.map((fn) => fn(stats)).filter(
      (m): m is string => m !== null,
    );
  }, [stats]);

  // 문구 회전 — 페이드 아웃 → 인덱스 교체 → 페이드 인.
  useEffect(() => {
    if (lines.length <= 1) return;
    const id = window.setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % lines.length);
        setVisible(true);
      }, FADE_MS);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [lines.length]);

  // 문구가 하나도 없으면(브랜드 초기) 전광판 자체를 숨긴다.
  if (lines.length === 0) return null;

  const current = lines[index % lines.length];

  return (
    <div className="mt-[20px] flex items-center gap-[10px] overflow-hidden rounded-[14px] border border-[#fde047]/30 bg-gradient-to-r from-[#2a1a4a]/80 to-[#3a245c]/80 px-[14px] py-[11px] backdrop-blur-sm">
      <Radio className="size-[16px] shrink-0 animate-pulse stroke-[#fde047]" />
      <p
        className={`flex-1 truncate text-[13px] font-medium text-white/90 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        {current}
      </p>
      {/* 진행 도트 — 현재 문구 위치 표시 */}
      {lines.length > 1 && (
        <div className="flex shrink-0 gap-[3px]">
          {lines.map((_, i) => (
            <span
              key={i}
              className={`size-[4px] rounded-full ${
                i === index % lines.length ? "bg-[#fde047]" : "bg-white/25"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
