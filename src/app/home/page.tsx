"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { MatchCard, type MatchCandidate } from "@/components/matching/match-card";
import { apiFetch } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { profileCompletionPct } from "@/lib/profile-completion";
import { dominantElement, type ElementProfile } from "@/lib/saju";

type Me = {
  id: number;
  nickname: string | null;
  photo_url: string | null;
  birth_date: string | null;
  birth_time: string | null;
  gender: string | null;
};

type SajuResponseLite = {
  element_profile: ElementProfile;
};

// Action tips are derived from the user's dominant element when available.
// Once the backend exposes per-day recommendations they'll come from
// /recommendations/today; for now we render only what we can defend.
function tipsForElement(dominant: string | null): string[] | null {
  switch (dominant) {
    case "wood":
      return ["산책이나 자연 속 대화가 첫인상 상승에 유리", "오전 시간대 만남 추천", "초록색 액세서리로 포인트"];
    case "fire":
      return ["밝은 색 옷이 첫인상 상승에 유리", "저녁 시간대 대화 시작 추천", "직설적인 표현보다 돌려 말하는 게 좋음"];
    case "earth":
      return ["편안한 카페에서의 대화가 좋음", "오후 시간대 만남 추천", "황토색·베이지 톤 의상이 유리"];
    case "metal":
      return ["깔끔한 정장 스타일이 첫인상에 유리", "낮 시간대 짧고 명료한 대화 추천", "흰색·은색 포인트 추천"];
    case "water":
      return ["조용한 곳에서 깊은 대화가 좋음", "밤 시간대 진솔한 대화 추천", "남색·검은색 톤 의상이 유리"];
    default:
      return null;
  }
}

export default function HomePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [matches, setMatches] = useState<MatchCandidate[] | null>(null);
  const [saju, setSaju] = useState<SajuResponseLite | null>(null);
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

  // Fetch matches + own saju once birth_date is known — backend rejects
  // both endpoints before onboarding is complete.
  useEffect(() => {
    if (!me || !me.birth_date) return;
    apiFetch<MatchCandidate[]>("/compatibility/matches?top_k=2")
      .then(setMatches)
      .catch(() => setMatches([]));
    apiFetch<SajuResponseLite>("/saju/me")
      .then(setSaju)
      .catch(() => setSaju(null));
  }, [me]);

  // Action tips depend on the user's dominant element. Hidden until saju
  // arrives so we never show stale generic copy.
  const tips =
    saju !== null ? tipsForElement(dominantElement(saju.element_profile)) : null;

  // Weights spec'd by product — see lib/profile-completion.ts. Today's
  // maximum is 60% because bio / 기본정보 fields aren't on the backend yet.
  const completion = profileCompletionPct(me);

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
          {matches === null ? (
            <p className="mt-[18px] text-center text-[12px] text-white/50">
              매칭 후보를 분석 중...
            </p>
          ) : matches.length === 0 ? (
            <p className="mt-[18px] text-center text-[12px] text-white/50">
              아직 매칭 가능한 상대가 없어요
            </p>
          ) : (
            <div className="mt-[18px] grid grid-cols-2 gap-[16px]">
              {matches.slice(0, 2).map((m) => (
                <button
                  key={m.user_id}
                  type="button"
                  onClick={() => {
                    // Hand the candidate down to the chat room so it can
                    // render headers without an extra fetch on hot navigation.
                    sessionStorage.setItem(
                      "activeChat",
                      JSON.stringify(m),
                    );
                    router.push(`/matching/${m.user_id}`);
                  }}
                  className="text-left transition active:scale-[0.98]"
                >
                  <MatchCard data={m} />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 행동 가이드 — saju가 도착한 뒤에만 렌더 */}
        {tips && (
          <section className="mt-[40px]">
            <h2 className="text-center text-[20px] font-bold text-white">
              행동 가이드
            </h2>
            <div className="mt-[14px] flex flex-col items-center gap-[6px] text-center text-[14px] text-white">
              {tips.map((tip) => (
                <p key={tip} className="leading-[25px]">{`"${tip}"`}</p>
              ))}
            </div>
          </section>
        )}

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