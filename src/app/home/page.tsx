"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { apiFetch } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";

type Me = {
  id: number;
  nickname: string | null;
  photo_url: string | null;
  birth_date: string | null;
};

// Placeholder match cards — backend match endpoints aren't wired yet, so we
// render fixed sample data here. Each card maps cleanly to a future
// /compatibility response.
const MATCH_CARDS: Array<{
  name: string;
  age: number;
  mbti: string;
  comment: string;
  photo: string;
}> = [
  {
    name: "김민주",
    age: 29,
    mbti: "INFP",
    comment: "둘이 연애하면 장기적으로\n금전운이 정말 좋아요!",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
  },
  {
    name: "설윤아",
    age: 25,
    mbti: "ESFP",
    comment: "서로의 부족한 점을\n완벽하게 보완해줘요",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
  },
];

const ACTION_TIPS = [
  "오늘은 밝은 색 옷이 첫인상 상승에 유리",
  "저녁 시간대 대화 시작 추천",
  "직설적인 표현보다 돌려 말하는 게 좋음",
];

export default function HomePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    apiFetch<Me>("/users/me")
      .then(setMe)
      .catch((e: Error) => setError(e.message));
  }, [router]);

  // Naive completion heuristic until we add a /completion endpoint:
  // 30% if just signed up; 60% once birth_date is set; 100% when nickname
  // and birth date both exist. Used to drive the progress bar at the top.
  const completion =
    me === null
      ? 30
      : me.birth_date && me.nickname
        ? 100
        : me.birth_date
          ? 60
          : 30;

  const nickname = me?.nickname ?? "OOO";

  return (
    <AppShell
      topChip={
        completion < 100 ? (
          <Link
            href="/onboarding/name"
            className="grid h-[18px] place-items-center rounded-full bg-[#fde047] px-3 text-[12px] font-medium text-[#1b1029]"
          >
            프로필 완성하기 →
          </Link>
        ) : null
      }
    >
      <div className="flex-1 px-[24px]">
        {/* Top: 인연 탐색기 가동률 */}
        <div className="mt-[14px]">
          <p className="text-center text-[12px] text-[#d8c8f2]">
            현재 <span className="font-medium">{nickname}</span>님의 인연 탐색기 가동률{" "}
            <span className="font-semibold text-[#fde047]">{completion}%</span>
          </p>
          <div className="mt-[10px] h-[12px] w-full overflow-hidden rounded-full bg-[#3a245c]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${completion}%`,
                backgroundImage:
                  "linear-gradient(101deg, rgb(124, 58, 237) 0%, rgb(168, 85, 247) 100%)",
              }}
            />
          </div>
          <p className="mt-[8px] text-[12px] text-[#d8c8f2]">
            Tip : 프로필을 완성할수록 운명의 상대를 만날 확률이 올라요!
          </p>
        </div>

        {/* 오늘의 인연운 */}
        <section className="mt-[20px] rounded-[18px] border border-white/20 bg-white/10 p-[16px] backdrop-blur-sm">
          <h2 className="text-center text-[20px] font-bold text-white">오늘의 인연운</h2>
          <p className="mt-[12px] whitespace-pre-line text-center text-[14px] text-[#d8c8f2]">
            {`"${nickname}님은 오늘 운명의 상대를 만날 확률이 높아요!\n맘에 두고 있는 사람이 있다면 표현해볼까요?"`}
          </p>
        </section>

        {/* 오늘의 매칭 카드 */}
        <section className="mt-[36px]">
          <h2 className="text-center text-[20px] font-bold text-white">
            오늘의 매칭 카드
          </h2>
          <div className="mt-[18px] grid grid-cols-2 gap-[16px]">
            {MATCH_CARDS.map((card) => (
              <article
                key={card.name}
                className="relative h-[245px] overflow-hidden rounded-[18px] border border-white/15 bg-white/10 shadow-[0px_10px_20px_0px_rgba(0,0,0,0.3),0px_0px_30px_0px_rgba(168,85,247,0.15)] backdrop-blur-sm"
              >
                {/* Photo with bottom fade so name sits readably */}
                <div className="absolute inset-x-[10px] top-[8px] aspect-[130/149] overflow-hidden rounded-[14px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.photo}
                    alt={card.name}
                    className="size-full object-cover"
                  />
                  <div className="absolute inset-0 rounded-[14px] bg-gradient-to-b from-transparent via-transparent to-[#1a1225]/80" />
                  <p className="absolute bottom-[6px] right-[10px] text-[14px] font-medium tracking-tight text-white">
                    {card.name}
                  </p>
                </div>
                {/* Stats */}
                <div className="absolute left-[12px] top-[162px] text-[14px] leading-[22px] text-white/80">
                  <p>나이 : {card.age}세</p>
                  <p>MBTI : {card.mbti}</p>
                </div>
                {/* Comment */}
                <p className="absolute bottom-[10px] left-1/2 w-[80%] -translate-x-1/2 whitespace-pre-line text-center text-[10px] text-white">
                  {card.comment}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* 행동 가이드 */}
        <section className="mt-[40px]">
          <h2 className="text-center text-[20px] font-bold text-white">행동 가이드</h2>
          <div className="mt-[14px] flex flex-col items-center gap-[6px] text-center text-[14px] text-white">
            {ACTION_TIPS.map((tip) => (
              <p key={tip} className="leading-[25px]">{`"${tip}"`}</p>
            ))}
          </div>
        </section>

        {/* Dev-only logout (small, low-key — to be replaced with proper menu) */}
        {error && (
          <p className="mt-[20px] text-center text-xs text-red-300">
            API 오류: {error}
          </p>
        )}
        <div className="mt-[24px] flex justify-center">
          <button
            type="button"
            onClick={() => {
              clearToken();
              router.replace("/");
            }}
            className="text-[12px] text-white/40 underline underline-offset-2"
          >
            로그아웃
          </button>
        </div>
      </div>
    </AppShell>
  );
}