"use client";

import { Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { MatchCard, type MatchCandidate } from "@/components/matching/match-card";
import { MatchInfoModal } from "@/components/matching/match-info-modal";
import { InfoBadge } from "@/components/saju/info-badge";
import { LoadingPanel } from "@/components/ui/loading-panel";
import { ApiError, apiFetch } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { CACHE_TTL, fetchWithCache } from "@/lib/cache";
import { EXTRA_DAILY_LIMIT, getTodayCard, unlockExtraCard } from "@/lib/matches";
import { notifyStarsChanged } from "@/lib/stars";
import { profileCompletionPct } from "@/lib/profile-completion";
import {
  BADGE_GLOSSARY,
  ELEMENT_GLOSSARY,
  TEN_GOD_GLOSSARY,
  TODAY_PILLAR_GLOSSARY,
} from "@/lib/saju-glossary-data";

type TodayFortune = {
  fortune_text: string;
  today_pillar: string;
  today_pillar_hanja: string;
  relation: string;
  element_today: string;
  score: number;
  headline: string;
  person_type: string;
  timing: string;
  place: string;
  caution: string;
  lucky_color: string;
  badges: string[];
};

type ActionGuide = { text: string };

type Me = {
  id: number;
  nickname: string | null;
  photo_url: string | null;
  birth_date: string | null;
  birth_time: string | null;
  gender: string | null;
  bio: string | null;
  height_cm: number | null;
  mbti: string | null;
  job: string | null;
  region: string | null;
};

export default function HomePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  // 오늘의 인연(무료 1장) — null=로딩중, {card:null}=후보 없음.
  const [today, setToday] = useState<{ card: MatchCandidate | null } | null>(
    null,
  );
  // 추가로 열람한 인연들(이번 세션). 카드는 항상 unblind 상태.
  const [extras, setExtras] = useState<MatchCandidate[]>([]);
  // 오늘 추가 열람한 장수(첫 열람 전엔 null=아직 모름). 한도 10장.
  const [extraUsed, setExtraUsed] = useState<number | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  // 스타 부족(402) 시 충전 유도 인라인 노출.
  const [needStars, setNeedStars] = useState(false);
  const [fortune, setFortune] = useState<TodayFortune | null>(null);
  const [guide, setGuide] = useState<ActionGuide | null>(null);
  // fortune fetch 가 실패한 적 있는지 — null 만으론 "로딩 중" 과
  // "실패" 를 구분 못 해서 사용자가 영원히 placeholder 만 보게 됨.
  // 한번이라도 실패하면 fallback 문구로 전환.
  const [fortuneFailed, setFortuneFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMatch, setActiveMatch] = useState<MatchCandidate | null>(null);
  // 가벼운 토스트 — 추가 열람 한도 초과(403)·후보 없음(404) 안내용.
  // 몇 초 후 자동 사라짐.
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    apiFetch<Me>("/users/me")
      .then(setMe)
      .catch((e: Error) => setError(e.message));
  }, [router]);

  // Fetch today's 인연 카드 + 오늘의 인연운/행동 가이드 once birth_date is
  // known — backend rejects these endpoints before onboarding is complete.
  // 운세/가이드는 fetchWithCache 로 stale-while-revalidate.
  useEffect(() => {
    if (!me || !me.birth_date) return;
    // 오늘의 인연 1장(무료, PRD 6.1). 후보 풀이 없으면 card=null.
    getTodayCard()
      .then(setToday)
      .catch(() => setToday({ card: null }));
    // 오늘의 인연운 — KST 일진 기반. 매일 자정에 결과가 바뀌므로
    // 짧은 캐시 (5분 정도면 같은 세션 안에선 안정적이고, 자정 넘기면
    // 자연스럽게 새 값으로 갱신됨).
    fetchWithCache<TodayFortune>(
      "/saju/me/today-fortune",
      CACHE_TTL.short,
      setFortune,
      {
        onError: () => {
          // 백엔드 미배포 / 일시 장애 시 placeholder 가 영원히 노출
          // 되지 않도록 실패 플래그 세팅 → 정적 fallback 문구 표시.
          setFortuneFailed(true);
        },
      },
    );
    // 행동 가이드 — 사주 기반 동적 추천 (색상/시간대/장소/의상 등).
    fetchWithCache<ActionGuide>(
      "/saju/me/action-guide",
      CACHE_TTL.short,
      setGuide,
      { onError: () => setGuide(null) },
    );
  }, [me]);

  // 행동 가이드는 백엔드 /saju/me/action-guide 응답을 그대로 사용.
  // 이전 tipsForElement(...) 정적 룩업은 더 이상 필요 없음.

  const completion = profileCompletionPct(me);

  const nickname = me?.nickname ?? "OOO";

  // 추가 인연 열람 — 별 10개 차감 후 다음 후보 공개.
  const handleUnlockExtra = async () => {
    if (unlocking) return;
    setUnlocking(true);
    setNeedStars(false);
    try {
      const res = await unlockExtraCard();
      setExtras((prev) => [...prev, res.card]);
      setExtraUsed(res.extra_unlocked_today);
      notifyStarsChanged(res.star_balance);
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        // 스타 부족 → 충전 유도.
        setNeedStars(true);
      } else if (e instanceof ApiError && e.status === 403) {
        setToast("오늘 추가 열람 한도(10장)를 모두 사용했어요.");
      } else if (e instanceof ApiError && e.status === 404) {
        setToast("오늘은 더 이상 추천할 인연이 없어요.");
      } else {
        setToast(e instanceof Error ? e.message : "인연을 열지 못했어요.");
      }
    } finally {
      setUnlocking(false);
    }
  };

  const limitReached = extraUsed !== null && extraUsed >= EXTRA_DAILY_LIMIT;

  return (
    <AppShell
      topChip={
        completion < 100 ? (
          <Link
            href="/mypage?incomplete=1"
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
            현재 <span className="font-medium">{nickname}</span>님의 프로필 진행률{" "}
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

        {/* 오늘의 인연운 — 백엔드 /saju/me/today-fortune 응답.
            KST 일진(日辰)이 매일 바뀌므로 결과 문구도 매일 갱신됨.
            응답 도착 전엔 프로필 미완성 사용자엔 기본 문구. */}
        <section className="mt-[20px] rounded-[18px] border border-white/20 bg-white/10 p-[16px] backdrop-blur-sm">
          <div className="flex items-center justify-center gap-[8px]">
            <h2 className="text-center text-[20px] font-bold text-white">
              오늘의 인연운
            </h2>
            {fortune && (
              <InfoBadge
                label={`오늘 일주 ${fortune.today_pillar}`}
                entry={
                  ELEMENT_GLOSSARY[fortune.element_today] ?? TODAY_PILLAR_GLOSSARY
                }
                variant="yellow"
              />
            )}
          </div>
          <p className="mt-[12px] whitespace-pre-line text-center text-[14px] leading-[22px] text-[#d8c8f2] text-ko">
            {fortune
              ? fortune.fortune_text
              : !me?.birth_date
                ? `"${nickname}님, 생년월일을 입력하면 매일 오늘의 인연운을 받을 수 있어요!"`
                : fortuneFailed
                  // API 실패 시: 옛 정적 문구로 fallback. 사용자에겐 빈
                  // 화면보다 자연스러움. 백엔드 복구되면 자동 dynamic 으로.
                  ? `"${nickname}님은 오늘 운명의 상대를 만날 확률이 높아요!\n맘에 두고 있는 사람이 있다면 표현해볼까요?"`
                  : `"${nickname}님의 오늘 인연운을 풀고 있어요..."`}
          </p>
          {fortune && (
            <>
              <div className="mt-[8px] flex items-center justify-center gap-[6px] text-[11px] text-white/55">
                <span>
                  {"★".repeat(fortune.score)}
                  {"☆".repeat(5 - fortune.score)}
                </span>
                {TEN_GOD_GLOSSARY[fortune.relation] && (
                  <InfoBadge
                    label={fortune.relation}
                    entry={TEN_GOD_GLOSSARY[fortune.relation]}
                    variant="muted"
                  />
                )}
              </div>
              {fortune.badges.length > 0 && (
                <div className="mt-[8px] flex flex-wrap justify-center gap-[6px]">
                  {fortune.badges.map((b) =>
                    BADGE_GLOSSARY[b] ? (
                      <InfoBadge
                        key={b}
                        label={b}
                        entry={BADGE_GLOSSARY[b]}
                        variant="yellow"
                      />
                    ) : (
                      <span
                        key={b}
                        className="rounded-full bg-[#fde047]/15 px-[8px] py-[2px] text-[10px] font-semibold text-[#fde047]"
                      >
                        {b}
                      </span>
                    ),
                  )}
                </div>
              )}
            </>
          )}
        </section>

        {/* 얼굴 사진 미등록 시 게이트 배너 — 매칭 카드 자체를 가리고
            대신 안내 + CTA 노출. 백엔드도 photo_url IS NULL 인 사용자
            에겐 빈 pack 을 돌려주지만, 이 배너로 사용자 인지 강화. */}
        {me && me.photo_url === null && (
          <section
            className="mt-[24px] rounded-[18px] border border-[#fde047]/40 bg-gradient-to-br from-[#fde047]/15 to-[#a78bfa]/10 p-[16px] backdrop-blur-sm"
          >
            <h2 className="text-center text-[16px] font-bold text-[#fde047]">
              ZAMI 인증 얼굴 사진을 등록해주세요
            </h2>
            <p className="mt-[8px] text-center text-[12px] leading-[18px] text-white/80">
              매칭은 얼굴이 잘 보이는 본인 사진(얼굴 면적 25% 이상)을
              메인으로 등록해야 시작돼요.
              <br />
              등록 시 ZAMI 공식 인증 뱃지가 함께 노출됩니다.
            </p>
            <Link
              href="/mypage"
              className="mx-auto mt-[14px] block w-fit rounded-full bg-[#fde047] px-[16px] py-[6px] text-[13px] font-bold text-[#1b1029]"
            >
              지금 등록하기 →
            </Link>
          </section>
        )}

        {/* 오늘의 인연 (무료 1장) + 추가 인연 유료 열람 (별 10개 / 하루 10장). */}
        <section className="mt-[36px]">
          <h2 className="text-center text-[20px] font-bold text-white">
            오늘의 인연
          </h2>

          {today === null ? (
            <p className="mt-[18px] text-center text-[12px] text-white/50">
              오늘의 인연을 찾는 중...
            </p>
          ) : today.card === null && extras.length === 0 ? (
            <p className="mt-[18px] text-center text-[12px] text-white/50">
              아직 매칭 가능한 상대가 없어요
            </p>
          ) : (
            <div className="mt-[18px] grid grid-cols-2 gap-x-[16px] gap-y-[26px]">
              {today.card && (
                <CardTile
                  candidate={today.card}
                  label="오늘의 인연"
                  onOpen={() => setActiveMatch(today.card)}
                />
              )}
              {extras.map((c) => (
                <CardTile
                  key={c.user_id}
                  candidate={c}
                  label="추가 인연"
                  onOpen={() => setActiveMatch(c)}
                />
              ))}
            </div>
          )}

          {/* 스타 부족 안내 → 충전 유도 */}
          {needStars && (
            <div className="mt-[16px] rounded-[14px] border border-[#fde047]/40 bg-[#fde047]/10 p-[14px] text-center">
              <p className="text-[13px] font-semibold text-white">
                스타가 부족해요
              </p>
              <p className="mt-[4px] text-[11px] text-white/70">
                인연 카드 1장을 열려면 별 10개가 필요해요.
              </p>
              <button
                type="button"
                onClick={() => router.push("/store")}
                className="mx-auto mt-[12px] block w-fit rounded-full bg-[#fde047] px-[16px] py-[6px] text-[13px] font-bold text-[#1b1029]"
              >
                스타 충전하러 가기 →
              </button>
            </div>
          )}

          {/* 추가 인연 열람 버튼 (별 10개) */}
          {today !== null && (today.card !== null || extras.length > 0) && (
            <div className="mt-[18px]">
              <button
                type="button"
                onClick={limitReached ? undefined : handleUnlockExtra}
                disabled={unlocking || limitReached}
                className="flex h-[50px] w-full items-center justify-center gap-[8px] rounded-[14px] border border-[#fde047]/50 bg-gradient-to-r from-yellow-300/15 to-pink-400/15 text-[15px] font-bold text-white disabled:opacity-50"
              >
                {limitReached ? (
                  <>오늘의 추가 열람을 모두 사용했어요</>
                ) : unlocking ? (
                  <>인연 카드 여는 중...</>
                ) : (
                  <>
                    <Sparkles className="size-[16px] stroke-[#fde047]" />
                    추가 인연 열람하기
                    <span className="flex items-center gap-[3px] text-[#fde047]">
                      <Star className="size-[14px] fill-[#fde047] stroke-[#fde047]" />
                      10
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </section>

        {/* 행동 가이드 — 백엔드 /saju/me/action-guide 응답.
            사용자 사주(일주 + 오행) + 오늘 일진을 종합해 항목별 추천. */}
        {me?.birth_date && (
          <section className="mt-[40px]">
            <h2 className="text-center text-[20px] font-bold text-white">
              행동 가이드
            </h2>
            {guide ? (
              <p className="mt-[14px] whitespace-pre-line text-center text-[14px] leading-[24px] text-[#d8c8f2] text-ko">
                {guide.text}
              </p>
            ) : (
              <div className="mt-[14px]">
                <LoadingPanel
                  estimatedMs={2500}
                  done={!!guide}
                  messages={[
                    { atPct: 0, text: "오늘의 사주 일진 보는 중..." },
                    { atPct: 40, text: "어울리는 옷·태도 고르는 중..." },
                    { atPct: 75, text: "마음가짐 메시지 다듬는 중..." },
                  ]}
                />
              </div>
            )}
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

      {activeMatch && (
        <MatchInfoModal
          candidate={activeMatch}
          onClose={() => setActiveMatch(null)}
          onOpenDetail={() => {
            router.push(`/profile/${activeMatch.user_id}`);
          }}
          onStartChat={() => {
            // 홈에 보이는 카드는 모두 이미 열람한(=unblind) 인연이므로
            // 바로 채팅 가능. (채팅 권한은 백엔드가 카드 열람 여부로 게이팅.)
            sessionStorage.setItem("activeChat", JSON.stringify(activeMatch));
            router.push(`/matching/${activeMatch.user_id}`);
          }}
        />
      )}

      {/* 토스트 — 추가 열람 한도/후보 없음 안내, 하단 중앙 고정 */}
      {toast && (
        <div className="fixed bottom-[100px] left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/15 bg-black/70 px-[14px] py-[8px] text-[12px] text-white backdrop-blur-sm">
          {toast}
        </div>
      )}
    </AppShell>
  );
}

/** 카드 한 장 + 상단 라벨 배지(오늘의 인연 / 추가 인연). 탭하면 onOpen. */
function CardTile({
  candidate,
  label,
  onOpen,
}: {
  candidate: MatchCandidate;
  label: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative text-left transition active:scale-[0.98]"
    >
      <div className="absolute -top-[6px] left-[6px] z-10 flex items-center gap-[4px] rounded-full bg-[#211432] px-[8px] py-[2px] text-[10px] font-semibold text-white shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
        <Star className="size-[10px] fill-[#fde047] stroke-[#fde047]" />
        <span className="text-[#fde047]">{label}</span>
      </div>
      <MatchCard data={candidate} />
    </button>
  );
}

