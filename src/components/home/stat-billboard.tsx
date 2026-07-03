"use client";
// 홈 화면 상단 전광판 — 서비스 통계 문구를 순환하며 노출한다.

import { useEffect, useMemo, useState } from "react";

import { CACHE_TTL, fetchWithCache } from "@/lib/cache";

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
    return `현재 회원 성비 : 남 ${mp}% · 여 ${100 - mp}%`;
  },
  (s) =>
    s.same_day_stem && s.same_day_stem.count > 0
      ? `나와 같은 사주인 ${s.same_day_stem.stem}을 가진 회원이 ${s.same_day_stem.count}명 있어요`
      : null,
  (s) =>
    s.same_element && s.same_element.count > 0
      ? `나와 같은 ${s.same_element.element} 기운의 회원이 ${s.same_element.count}명 있어요`
      : null,
];

const ROTATE_MS = 4000;
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

  const lines = useMemo(() => {
    if (!stats) return [] as string[];
    return MESSAGES.map((fn) => fn(stats)).filter(
      (m): m is string => m !== null,
    );
  }, [stats]);

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

  if (lines.length === 0) return null;

  const current = lines[index % lines.length];

  return (
    <div className="mt-[20px] flex items-center gap-[10px] overflow-hidden rounded-[14px] border border-[#fde047]/30 bg-gradient-to-r from-[#2a1a4a]/80 to-[#3a245c]/80 px-[14px] py-[11px] backdrop-blur-sm">
      <p
        className={`flex-1 truncate text-[13px] font-medium text-white/90 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        {current}
      </p>
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