"use client";

import { ArrowLeft, Lock } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ZamiVerifiedBadge } from "@/components/brand/zami-verified-badge";
import { AppShell } from "@/components/layout/app-shell";
import { PhotoCarousel } from "@/components/matching/photo-carousel";
import { INTERVIEW_QUESTION_MAP } from "@/lib/interview";
import { LoadingPanel } from "@/components/ui/loading-panel";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

const PLACEHOLDER_PHOTO =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=600&fit=crop";

type PublicProfile = {
  id: number;
  nickname: string | null;
  photo_url: string | null;
  photos: string[];
  is_blinded: boolean;
  age: number | null;
  gender: string | null;
  bio: string | null;
  height_cm: number | null;
  mbti: string | null;
  job: string | null;
  region: string | null;
  smoking: string | null;
  drinking: string | null;
  religion: string | null;
  dominant_element: string | null;
  day_pillar: string | null;
  compatibility_score: number | null;
  is_face_verified: boolean;
  // 연애 인터뷰 — 상호주의로 내가 볼 수 있는 만큼만. interview_total 은 상대 전체 답변 수.
  interview_answers: { question_key: string; answer: string }[];
  interview_total: number;
};

// ──────────────────────────────────────────────────────────────────────
// ⚠️ 테스트용 mock — 사람별(peerId) 로 다른 프로필을 보여준다. interview_total
// 은 동적으로 채우므로 여기선 interview_answers 만(=상대의 전체 답변) 담는다.
// 확인이 끝나면 USE_MOCK_PROFILE 을 false 로 바꾸거나 이 블록을 지우세요.
const USE_MOCK_PROFILE = true;
type MockProfile = Omit<PublicProfile, "id" | "interview_total">;
const MOCK_PROFILES: MockProfile[] = [
  {
    nickname: "김민주",
    photo_url:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=750&fit=crop",
    photos: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=750&fit=crop",
    ],
    is_blinded: false,
    age: 26,
    gender: "female",
    bio: "주말엔 카페 투어랑 등산 좋아해요. 솔직하고 편한 대화 환영!",
    height_cm: 164,
    mbti: "ENFP",
    job: "UX 디자이너",
    region: "서울 마포구",
    smoking: "비흡연",
    drinking: "가끔",
    religion: "무교",
    dominant_element: "목",
    day_pillar: "을사",
    compatibility_score: 88,
    is_face_verified: true,
    interview_answers: [
      { question_key: "life_dayoff", answer: "주로 집에서 푹 쉬다가 저녁엔 카페로 산책 겸 나가요." },
      { question_key: "life_date_style", answer: "새로운 동네 카페·전시 찾아다니는 외출 데이트를 좋아해요." },
      { question_key: "humor_small_happiness", answer: "퇴근길에 좋아하는 노래 들으며 걷는 시간이 행복해요." },
      { question_key: "life_dating_type", answer: "처음엔 차분하지만 친해지면 장난도 많이 치는 편이에요." },
      { question_key: "love_affection", answer: "말보다 행동으로 챙겨주는 걸로 표현해요." },
      { question_key: "love_conflict", answer: "감정이 가라앉은 뒤에 솔직하게 대화로 풀어요." },
      { question_key: "pace_speed", answer: "천천히 알아가면서 신뢰를 쌓는 편이에요." },
      { question_key: "value_good_person", answer: "서로의 시간과 취향을 존중해주는 사람이요." },
    ],
  },
  {
    nickname: "이서연",
    photo_url:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=750&fit=crop",
    photos: [
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&h=750&fit=crop",
    ],
    is_blinded: false,
    age: 29,
    gender: "female",
    bio: "에너지 넘치는 편이에요! 같이 핫플 다니고 운동할 사람 환영.",
    height_cm: 167,
    mbti: "ESFP",
    job: "마케터",
    region: "서울 강남구",
    smoking: "비흡연",
    drinking: "즐겨요",
    religion: "무교",
    dominant_element: "화",
    day_pillar: "병오",
    compatibility_score: 74,
    is_face_verified: true,
    interview_answers: [
      { question_key: "life_dayoff", answer: "친구들 만나서 핫플 다니거나 운동해요." },
      { question_key: "love_affection", answer: "표현 확실하게 해요. 좋으면 바로 티 나는 편!" },
      { question_key: "love_conflict", answer: "그 자리에서 바로 풀어야 직성이 풀려요." },
      { question_key: "value_dealbreaker", answer: "거짓말이랑 연락 끊기는 건 못 넘어가요." },
      { question_key: "pace_speed", answer: "마음 가면 빠르게 다가가는 편이에요." },
      { question_key: "real_busy", answer: "바빠도 짧게라도 연락 주고받는 걸 원해요." },
    ],
  },
  {
    nickname: "박지훈",
    photo_url:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=750&fit=crop",
    photos: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=750&fit=crop",
    ],
    is_blinded: false,
    age: 31,
    gender: "male",
    bio: "집순이·집돌이 환영. 조용히 취향 맞춰가는 연애 좋아해요.",
    height_cm: 178,
    mbti: "INTP",
    job: "개발자",
    region: "경기 성남시",
    smoking: "비흡연",
    drinking: "가끔",
    religion: "무교",
    dominant_element: "수",
    day_pillar: "임자",
    compatibility_score: 81,
    is_face_verified: true,
    interview_answers: [
      { question_key: "life_dayoff", answer: "집에서 게임하거나 넷플릭스 정주행해요." },
      { question_key: "life_date_style", answer: "조용한 카페나 집데이트가 편해요." },
      { question_key: "love_affection", answer: "말보다는 챙겨주는 행동으로 표현해요." },
      { question_key: "pace_deepening", answer: "사소한 일상까지 공유하게 될 때 깊어졌다고 느껴요." },
      { question_key: "value_good_person", answer: "서로 솔직하고 신뢰가 가는 사람이요." },
    ],
  },
  {
    nickname: "정하늘",
    photo_url:
      "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=600&h=750&fit=crop",
    photos: [
      "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&h=750&fit=crop",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=750&fit=crop",
    ],
    is_blinded: false,
    age: 27,
    gender: "female",
    bio: "한결같고 편안한 연애를 좋아해요. 따뜻한 사람 찾아요.",
    height_cm: 162,
    mbti: "ISFJ",
    job: "간호사",
    region: "부산 해운대구",
    smoking: "비흡연",
    drinking: "안 마셔요",
    religion: "무교",
    dominant_element: "토",
    day_pillar: "무술",
    compatibility_score: 69,
    is_face_verified: false,
    interview_answers: [
      { question_key: "life_habit_match", answer: "규칙적인 생활 습관이 잘 맞으면 좋겠어요." },
      { question_key: "humor_small_happiness", answer: "퇴근 후 따뜻한 차 한 잔이요." },
      { question_key: "love_hurt", answer: "서운하면 속으로 삭이다가 나중에 얘기해요." },
      { question_key: "charm_crush", answer: "좋아하면 더 챙겨주고 표정이 부드러워져요." },
      { question_key: "real_balance", answer: "일과 연애 둘 다 소중해서 균형을 중요하게 봐요." },
      { question_key: "value_good_person", answer: "한결같고 배려 깊은 사람이요." },
      { question_key: "pace_speed", answer: "천천히 알아가는 걸 선호해요." },
    ],
  },
];

/** peerId 로 안정적으로 한 명을 고른다(같은 사람 → 항상 같은 mock). */
function pickMockProfile(peerId: number): MockProfile {
  const n = MOCK_PROFILES.length;
  const i = (((peerId % n) + n) % n) || 0;
  return MOCK_PROFILES[Number.isFinite(i) ? i : 0];
}
// ──────────────────────────────────────────────────────────────────────

/**
 * /profile/[id] — 매칭 카드 "상세 정보 확인" CTA 의 도착지.
 *
 * 상대의 공개 프로필(사진/닉네임/나이/MBTI/직업/거주지/한 줄 자기소개 +
 * 사주 요약)을 보여준다. 무료 티어이면 사진은 잠긴 상태로 노출되고,
 * 결제 후 채팅 시작 버튼이 활성화된다.
 */
export default function ProfileDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const peerId = Number(params.id);

  const [data, setData] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    if (USE_MOCK_PROFILE) {
      // 테스트 모드 — peerId 로 사람을 고르고, 상호주의(내가 답한 개수만큼만
      // 상대 답변 공개)를 그대로 흉내낸다. 내 답변 수는 실제 백엔드에서 읽어온다.
      const base = pickMockProfile(peerId);
      const total = base.interview_answers.length;
      apiFetch<{ question_key: string; answer: string }[]>("/users/me/interview")
        .then((mine) => {
          const visible = Math.min(mine.length, total);
          setData({
            ...base,
            id: peerId,
            interview_total: total,
            interview_answers: base.interview_answers.slice(0, visible),
          });
        })
        .catch(() => {
          // 내 답변을 못 불러오면 0개로 간주 → 전부 잠김.
          setData({
            ...base,
            id: peerId,
            interview_total: total,
            interview_answers: [],
          });
        });
      return;
    }
    apiFetch<PublicProfile>(`/users/${peerId}/public-profile`)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [router, peerId]);

  // 채팅 권한은 백엔드가 "카드 열람 여부"로 게이팅한다(PRD 6.2). 이 화면은
  // 열람한 카드의 상세에서 도달하므로 바로 채팅 진입한다. 미열람 상태라면
  // 채팅방에서 첫 전송 시 403 안내가 노출된다.
  const startChat = () => {
    if (!data) return;
    sessionStorage.setItem(
      "activeChat",
      JSON.stringify({
        user_id: data.id,
        nickname: data.nickname,
        photo_url: data.photo_url,
        score: data.compatibility_score ?? 0,
        age: data.age,
        gender: data.gender,
        is_blinded: data.is_blinded,
        birth_year: null,
        dominant_element: data.dominant_element,
        mbti: data.mbti,
      }),
    );
    router.push(`/matching/${data.id}`);
  };

  return (
    <AppShell>
      <div className="flex-1 px-[20px] pb-[40px]">
        <div className="relative pt-[14px]">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="뒤로"
            className="absolute left-0 top-[14px]"
          >
            <ArrowLeft className="size-[24px] stroke-white stroke-[2]" />
          </button>
          <h1 className="text-center text-[20px] font-bold text-white">
            상세 정보
          </h1>
        </div>

        {!data && !error && (
          <div className="mt-[60px]">
            <LoadingPanel
              estimatedMs={1800}
              done={!!data}
              messages={[
                { atPct: 0, text: "프로필 정보 불러오는 중..." },
                { atPct: 60, text: "정보 정리 중..." },
              ]}
            />
          </div>
        )}

        {error && (
          <p className="mt-[40px] text-center text-[13px] text-red-300">
            상세 정보를 불러오지 못했어요: {error}
          </p>
        )}

        {data && (
          <>
            {/* Hero photo carousel(드래그 스와이프 + 하단 점) */}
            <PhotoCarousel
              photos={
                data.photos && data.photos.length > 0
                  ? data.photos
                  : [data.photo_url ?? PLACEHOLDER_PHOTO]
              }
              alt={data.nickname ?? "프로필"}
              enabled={!data.is_blinded}
              className="mt-[20px] aspect-[4/5] w-full overflow-hidden rounded-[18px] border border-white/15 bg-white/10"
              imageClassName={`size-full object-cover ${
                data.is_blinded ? "blur-[18px] scale-110" : ""
              }`}
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#1a1225]/85" />
              {data.compatibility_score !== null && (
                <div className="absolute left-[14px] top-[14px] rounded-full bg-purple-500/95 px-[12px] py-[4px] text-[13px] font-bold text-white shadow-[0_0_10px_-2px_rgba(168,85,247,0.8)]">
                  궁합 {data.compatibility_score}%
                </div>
              )}
              {/* ZAMI 공식 얼굴 인증 뱃지 — 메인 사진이 strict face check
                  통과한 사용자에게 우상단에 노출. 신뢰도 시그널. */}
              {data.is_face_verified && !data.is_blinded && (
                <div className="absolute right-[14px] top-[14px]">
                  <ZamiVerifiedBadge size="md" />
                </div>
              )}
              <p className="absolute bottom-[16px] right-[18px] text-[28px] font-semibold tracking-tight text-white">
                {data.nickname ?? "익명"}
                {data.age !== null && (
                  <span className="ml-[6px] text-[18px] font-medium text-white/85">
                    {data.age}
                  </span>
                )}
              </p>
              {data.is_blinded && (
                <div className="pointer-events-none absolute inset-x-0 top-1/2 grid -translate-y-1/2 place-items-center">
                  <div className="flex items-center gap-[6px] rounded-full bg-black/60 px-[14px] py-[6px] text-[13px] font-medium text-white/95 backdrop-blur-sm">
                    <Lock className="size-[14px]" />
                    카드 열람 후 사진 공개
                  </div>
                </div>
              )}
            </PhotoCarousel>

            {/* 한 줄 자기소개 */}
            {data.bio && (
              <div className="mt-[16px] rounded-[14px] border border-white/15 bg-white/10 p-[14px] backdrop-blur-sm">
                <p className="text-center text-[14px] leading-[22px] text-white">
                  &ldquo;{data.bio}&rdquo;
                </p>
              </div>
            )}

            {/* 기본 정보 */}
            <section className="mt-[20px]">
              <h2 className="text-center text-[16px] font-semibold text-white">
                기본 정보
              </h2>
              <div className="relative mt-[10px] grid grid-cols-2 rounded-[18px] border border-white/20 bg-white/10 p-[16px] backdrop-blur-sm">
                <div className="absolute inset-y-[16px] left-1/2 w-px bg-white/15" />
                <InfoRows
                  rows={[
                    ["나이", data.age !== null ? `${data.age}세` : "—"],
                    [
                      "성별",
                      data.gender === "male"
                        ? "남자"
                        : data.gender === "female"
                          ? "여자"
                          : "—",
                    ],
                    ["직업", data.job ?? "—"],
                    ["거주지", data.region ?? "—"],
                  ]}
                />
                <InfoRows
                  rows={[
                    ["키", data.height_cm ? `${data.height_cm}cm` : "—"],
                    ["흡연", data.smoking ?? "—"],
                    ["음주", data.drinking ?? "—"],
                    ["종교", data.religion ?? "—"],
                  ]}
                />
              </div>
            </section>

            {/* 연애 인터뷰 — 상호주의로 내가 답한 만큼만 공개. */}
            {data.interview_total > 0 && (
              <section className="mt-[20px]">
                <h2 className="text-center text-[16px] font-semibold text-white">
                  연애 인터뷰
                </h2>
                <div className="mt-[10px] space-y-[10px]">
                  {data.interview_answers.map((a) => (
                    <div
                      key={a.question_key}
                      className="rounded-[14px] border border-white/15 bg-white/10 p-[14px] backdrop-blur-sm"
                    >
                      <p className="text-[12px] font-medium text-[#fde047]">
                        {INTERVIEW_QUESTION_MAP[a.question_key] ?? "질문"}
                      </p>
                      <p className="mt-[6px] text-[13px] leading-[20px] text-white/90">
                        {a.answer}
                      </p>
                    </div>
                  ))}

                  {/* 상호주의 잠금 안내 — 상대가 더 답했는데 내가 덜 답한 경우 */}
                  {data.interview_total > data.interview_answers.length && (
                    <div className="flex items-center justify-center gap-[6px] rounded-[14px] border border-dashed border-white/20 bg-white/5 px-[14px] py-[12px] text-center">
                      <Lock className="size-[13px] text-white/50" />
                      <p className="text-[12px] leading-[18px] text-white/60">
                        잠긴 답변 {data.interview_total - data.interview_answers.length}개 · 내가 인터뷰를 더 답하면 볼 수 있어요
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* CTAs */}
            <div className="mt-[24px] flex flex-col gap-[10px]">
              <button
                type="button"
                onClick={startChat}
                className="h-[52px] w-full rounded-[12px] text-[16px] font-bold text-white shadow-[0_0_15px_-2px_rgba(168,85,247,0.5)]"
                style={{
                  backgroundImage:
                    "linear-gradient(99deg, rgb(124, 58, 237) 0%, rgb(168, 85, 247) 100%)",
                }}
              >
                채팅 시작하기
              </button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function InfoRows({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="flex flex-col gap-[6px] px-[6px] text-[14px]">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between">
          <span className="text-[12px] text-white/70">{label}</span>
          <span className="font-semibold text-white">{value}</span>
        </div>
      ))}
    </div>
  );
}