"use client";

import {
  ArrowLeft,
  Camera,
  Pencil,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { PhotoUploadModal } from "@/components/mypage/photo-upload-modal";
import { apiFetch } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";

type Me = {
  id: number;
  kakao_id: string | null;
  nickname: string | null;
  photo_url: string | null;
  birth_date: string | null;
  birth_time: string | null;
  calendar_type: string | null;
  is_leap_month: boolean;
  gender: string | null;
};

// Profile completion is computed off the fields the backend currently knows
// about — extend this set when more profile fields land (height, MBTI, etc.).
const TRACKED_FIELDS: Array<keyof Me> = [
  "nickname",
  "photo_url",
  "birth_date",
  "birth_time",
  "gender",
];

function calcCompletion(me: Me | null): number {
  if (!me) return 0;
  const filled = TRACKED_FIELDS.filter((k) => {
    const v = me[k];
    return v !== null && v !== undefined && v !== "";
  }).length;
  return Math.round((filled / TRACKED_FIELDS.length) * 100);
}

function calcAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const dob = new Date(birthDate);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age;
}

export default function MypagePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    apiFetch<Me>("/users/me")
      .then(setMe)
      .catch(() => {});
  }, [router]);

  const completion = calcCompletion(me);
  const age = calcAge(me?.birth_date ?? null);
  const genderLabel = me?.gender === "male" ? "남자" : me?.gender === "female" ? "여자" : "—";

  return (
    <AppShell>
      <div className="flex-1 px-[20px]">
        {/* Sub-header — back arrow + "마이페이지" title */}
        <div className="relative pt-[14px]">
          <button
            type="button"
            onClick={() => router.push("/home")}
            aria-label="뒤로"
            className="absolute left-0 top-[14px]"
          >
            <ArrowLeft className="size-[24px] stroke-white stroke-[2]" />
          </button>
          <h1 className="text-center text-[20px] font-bold text-white">마이페이지</h1>
        </div>

        {/* Profile photo + side action icons */}
        <div className="relative mt-[24px] flex justify-center">
          {/* Side action icons — placeholder targets for now */}
          <div className="absolute left-[10px] top-[12px] flex flex-col items-center gap-[24px] text-[10px] text-white">
            <button
              type="button"
              onClick={() => setPhotoModalOpen(true)}
              className="flex flex-col items-center gap-[6px]"
            >
              <Camera className="size-[20px] stroke-white stroke-[1.5]" />
              프로필 사진
            </button>
            <button type="button" className="flex flex-col items-center gap-[6px]">
              <Pencil className="size-[20px] stroke-white stroke-[1.5]" />
              자기소개
            </button>
            <button
              type="button"
              onClick={() => router.push("/onboarding/name")}
              className="flex flex-col items-center gap-[6px]"
            >
              <Search className="size-[20px] stroke-white stroke-[1.5]" />
              기본정보 입력
            </button>
          </div>

          {/* Photo card */}
          <div className="relative size-[230px] overflow-hidden rounded-[18px] bg-white/10">
            {me?.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={me.photo_url}
                alt={me.nickname ?? "profile"}
                className="size-full object-cover"
              />
            ) : (
              <div className="grid size-full place-items-center text-white/40">
                프로필 사진
              </div>
            )}
          </div>
        </div>

        {/* Completion progress bar */}
        <div className="mt-[20px]">
          <div className="h-[5px] w-full overflow-hidden rounded-full bg-white/30">
            <div
              className="h-full rounded-full"
              style={{
                width: `${completion}%`,
                backgroundImage:
                  "linear-gradient(110deg, rgb(124, 58, 237) 0%, rgb(168, 85, 247) 100%)",
              }}
            />
          </div>
          <p className="mt-[4px] text-right text-[10px] text-white/60">
            프로필 완성도 {completion}%
          </p>
        </div>

        {/* 한 줄 자기소개 — backend has no field yet, render encouragement */}
        <section className="mt-[16px] rounded-[18px] border border-white/20 bg-white/10 p-[14px] backdrop-blur-sm">
          <h2 className="text-center text-[18px] font-semibold text-white tracking-tight">
            한 줄 자기소개
          </h2>
          <p className="mt-[8px] text-center text-[14px] text-[#d8c8f2]">
            안정적인 사람을 만나서 오래도록 연애하고 싶어요!
          </p>
        </section>

        {/* 기본 정보 */}
        <section className="mt-[20px]">
          <h2 className="text-center text-[16px] font-semibold text-white">
            기본 정보
          </h2>
          <div className="relative mt-[10px] grid grid-cols-2 rounded-[18px] border border-white/20 bg-white/10 p-[16px] backdrop-blur-sm">
            {/* Vertical divider between columns */}
            <div className="absolute inset-y-[16px] left-1/2 w-px bg-white/15" />
            {/* Left column */}
            <InfoRows
              rows={[
                ["이름", me?.nickname ?? "—"],
                ["나이", age !== null ? `${age}세` : "—"],
                ["성별", genderLabel],
                ["직업", "—"],
              ]}
            />
            {/* Right column */}
            <InfoRows
              rows={[
                ["키", "—"],
                ["흡연", "—"],
                ["음주", "—"],
                ["종교", "—"],
                ["MBTI", "—"],
              ]}
            />
          </div>
        </section>

        {/* CTA — 운명의 지도 (사주) */}
        <button
          type="button"
          onClick={() => router.push("/saju")}
          className="mt-[24px] h-[51px] w-full rounded-[18px] text-[18px] font-bold text-white shadow-[0px_0px_15px_3px_rgba(90,58,130,1)]"
          style={{
            backgroundImage:
              "linear-gradient(99deg, rgb(124, 58, 237) 0%, rgb(168, 85, 247) 100%)",
          }}
        >
          운명의 지도 펼쳐보기
        </button>

        {/* Dev: logout */}
        <div className="mt-[20px] flex justify-center">
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

      {photoModalOpen && (
        <PhotoUploadModal
          currentPhoto={me?.photo_url ?? null}
          onClose={() => setPhotoModalOpen(false)}
          onSave={(_url) => {
            // TODO: PATCH /users/me/profile with the uploaded photo URL once
            // we have an image hosting endpoint. For now we just close.
            setPhotoModalOpen(false);
            alert("사진 업로드 기능은 백엔드 연동 후 활성화됩니다.");
          }}
        />
      )}
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