"use client";

import { ArrowLeft, Lock, Sparkles } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ZamiVerifiedBadge } from "@/components/brand/zami-verified-badge";
import { AppShell } from "@/components/layout/app-shell";
import { PaymentModal } from "@/components/payment/payment-modal";
import { LoadingPanel } from "@/components/ui/loading-panel";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

const PLACEHOLDER_PHOTO =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=600&fit=crop";

type PublicProfile = {
  id: number;
  nickname: string | null;
  photo_url: string | null;
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
};

type Me = { id: number; is_paid: boolean };

const ELEMENT_HANJA: Record<string, string> = {
  목: "木",
  화: "火",
  토: "土",
  금: "金",
  수: "水",
};

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

  const [me, setMe] = useState<Me | null>(null);
  const [data, setData] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    apiFetch<Me>("/users/me")
      .then(setMe)
      .catch(() => {});
    apiFetch<PublicProfile>(`/users/${peerId}/public-profile`)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [router, peerId]);

  const startChat = () => {
    if (!data) return;
    if (!me?.is_paid) {
      setPaymentOpen(true);
      return;
    }
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
                { atPct: 60, text: "사진·MBTI·궁합 정렬 중..." },
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
            {/* Hero photo */}
            <div className="relative mt-[20px] aspect-[4/5] w-full overflow-hidden rounded-[18px] border border-white/15 bg-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.photo_url ?? PLACEHOLDER_PHOTO}
                alt={data.nickname ?? "프로필"}
                className={`size-full object-cover ${
                  data.is_blinded ? "blur-[18px] scale-110" : ""
                }`}
              />
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
                    결제 후 사진 공개
                  </div>
                </div>
              )}
            </div>

            {/* 한 줄 자기소개 */}
            {data.bio && (
              <div className="mt-[16px] rounded-[14px] border border-white/15 bg-white/10 p-[14px] backdrop-blur-sm">
                <p className="text-center text-[14px] leading-[22px] text-white">
                  &ldquo;{data.bio}&rdquo;
                </p>
              </div>
            )}

            {/* 사주 요약 (일주 + 주요 오행) */}
            {(data.day_pillar || data.dominant_element) && (
              <section className="mt-[16px] grid grid-cols-2 gap-[10px]">
                {data.day_pillar && (
                  <Stat label="일주" value={data.day_pillar} />
                )}
                {data.dominant_element && (
                  <Stat
                    label="주요 오행"
                    value={`${data.dominant_element}(${
                      ELEMENT_HANJA[data.dominant_element] ?? ""
                    })`}
                  />
                )}
              </section>
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
                    ["MBTI", data.mbti ?? "—"],
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

            {/* CTAs */}
            <div className="mt-[24px] flex flex-col gap-[10px]">
              <button
                type="button"
                onClick={() => router.push(`/destiny/${data.id}`)}
                className="flex h-[48px] w-full items-center justify-center gap-[8px] rounded-[12px] border border-yellow-300/40 bg-gradient-to-r from-yellow-300/15 to-pink-400/15 text-[15px] font-semibold text-white hover:from-yellow-300/25 hover:to-pink-400/25"
              >
                <Sparkles className="size-[16px] stroke-yellow-300" />
                운명의 실타래 풀이 보기
              </button>
              <button
                type="button"
                onClick={startChat}
                className="h-[52px] w-full rounded-[12px] text-[16px] font-bold text-white shadow-[0_0_15px_-2px_rgba(168,85,247,0.5)]"
                style={{
                  backgroundImage:
                    "linear-gradient(99deg, rgb(124, 58, 237) 0%, rgb(168, 85, 247) 100%)",
                }}
              >
                {me?.is_paid ? "채팅 시작하기" : "🔒 결제 후 채팅하기"}
              </button>
            </div>
          </>
        )}
      </div>

      {paymentOpen && (
        <PaymentModal
          reason="chat"
          onClose={() => setPaymentOpen(false)}
          onPaid={() => {
            setMe((prev) => (prev ? { ...prev, is_paid: true } : prev));
            setPaymentOpen(false);
            // After payment, kick straight into the chat room.
            if (data) {
              sessionStorage.setItem(
                "activeChat",
                JSON.stringify({
                  user_id: data.id,
                  nickname: data.nickname,
                  photo_url: data.photo_url,
                  score: data.compatibility_score ?? 0,
                  age: data.age,
                  gender: data.gender,
                  is_blinded: false,
                  birth_year: null,
                  dominant_element: data.dominant_element,
                  mbti: data.mbti,
                }),
              );
              router.push(`/matching/${data.id}`);
            }
          }}
        />
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-white/15 bg-white/5 p-[12px] text-center backdrop-blur-sm">
      <p className="text-[11px] text-white/60">{label}</p>
      <p className="mt-[4px] text-[18px] font-bold text-white">{value}</p>
    </div>
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