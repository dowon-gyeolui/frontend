"use client";

import {
  ArrowLeft,
  Camera,
  Pencil,
  Search,
  UserX,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import {
  BasicInfoEditModal,
  type BasicInfoInitial,
} from "@/components/mypage/basic-info-edit-modal";
import { BioEditModal } from "@/components/mypage/bio-edit-modal";
import { PhotoUploadModal } from "@/components/mypage/photo-upload-modal";
import { apiFetch } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import { completionRows, profileCompletionPct } from "@/lib/profile-completion";

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
  bio: string | null;
  height_cm: number | null;
  mbti: string | null;
  job: string | null;
  region: string | null;
  smoking: string | null;
  drinking: string | null;
  religion: string | null;
};

// Profile completion is now derived in lib/profile-completion.ts so home
// and mypage agree on weights (basic 30 / time 10 / photo 20 / bio 20 /
// basic-info 20).

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
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="flex flex-1 items-center justify-center">
            <p className="text-white/60">로딩 중...</p>
          </div>
        </AppShell>
      }
    >
      <MypageContent />
    </Suspense>
  );
}

function MypageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const incomplete = params.get("incomplete") === "1";
  const [me, setMe] = useState<Me | null>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [bioOpen, setBioOpen] = useState(false);
  const [basicOpen, setBasicOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const confirmLeave = async () => {
    if (leaving) return;
    setLeaving(true);
    setLeaveError(null);
    try {
      await apiFetch("/users/me", { method: "DELETE" });
      clearToken();
      router.replace("/");
    } catch (e) {
      setLeaveError(e instanceof Error ? e.message : "탈퇴 실패");
      setLeaving(false);
    }
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    apiFetch<Me>("/users/me")
      .then(setMe)
      .catch(() => {});
  }, [router]);

  const completion = profileCompletionPct(me);
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
          <button
            type="button"
            onClick={() => {
              setLeaveError(null);
              setLeaveOpen(true);
            }}
            aria-label="탈퇴하기"
            className="absolute right-0 top-[14px] flex items-center gap-[4px] rounded-full border border-white/20 bg-white/5 px-[10px] py-[4px] text-[11px] text-white/70 hover:bg-white/15"
          >
            <UserX className="size-[12px] stroke-white/70 stroke-[2]" />
            탈퇴하기
          </button>
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
            <button
              type="button"
              onClick={() => setBioOpen(true)}
              className="flex flex-col items-center gap-[6px]"
            >
              <Pencil className="size-[20px] stroke-white stroke-[1.5]" />
              자기소개
            </button>
            <button
              type="button"
              onClick={() => setBasicOpen(true)}
              className="flex flex-col items-center gap-[6px]"
            >
              <Search className="size-[20px] stroke-white stroke-[1.5]" />
              정보 수정
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

        {/* Missing-items callout — shown when not yet 100%. The yellow highlight
            kicks in when the user came from "프로필 완성하기" on /home so it's
            obvious why they were redirected. */}
        {me && completion < 100 && (
          <div
            className={`mt-[12px] rounded-[14px] border p-[14px] backdrop-blur-sm ${
              incomplete
                ? "border-[#fde047]/60 bg-[#fde047]/15 shadow-[0_0_15px_-2px_rgba(253,224,71,0.4)]"
                : "border-white/20 bg-white/10"
            }`}
          >
            <p className="text-[13px] font-semibold text-white">
              {incomplete
                ? "프로필을 완성해야 100% 가동률이 돼요!"
                : `프로필 완성도 ${completion}% — 100% 까지 ${100 - completion}% 남았어요`}
            </p>
            <ul className="mt-[10px] space-y-[6px]">
              {completionRows(me)
                .filter((r) => !r.earned)
                .map((r) => (
                  <li key={r.label}>
                    <button
                      type="button"
                      onClick={() => {
                        if (r.label === "한 줄 자기소개 추가") setBioOpen(true);
                        else if (r.label === "기본 정보 입력") setBasicOpen(true);
                        else if (r.label === "프로필 사진 추가")
                          setPhotoModalOpen(true);
                        else if (r.label === "시간 (출생 시간)") setBasicOpen(true); // closest tap target
                        else router.push("/onboarding/name");
                      }}
                      className="flex w-full items-center justify-between rounded-[10px] bg-white/5 px-[10px] py-[8px] text-left hover:bg-white/10"
                    >
                      <span className="flex items-center gap-[8px] text-[12px] text-white/85">
                        <span className="text-[#fde047]">✦</span>
                        {r.label}
                      </span>
                      <span className="text-[11px] text-white/50">
                        +{r.pct}% →
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* 한 줄 자기소개 — backed by users.bio; tap to edit */}
        <button
          type="button"
          onClick={() => setBioOpen(true)}
          className="mt-[16px] block w-full rounded-[18px] border border-white/20 bg-white/10 p-[14px] text-left backdrop-blur-sm hover:bg-white/15"
        >
          <h2 className="text-center text-[18px] font-semibold text-white tracking-tight">
            한 줄 자기소개
          </h2>
          <p className={`mt-[8px] text-center text-[14px] ${me?.bio ? "text-[#d8c8f2]" : "text-white/40"}`}>
            {me?.bio ?? "탭해서 한 줄 자기소개를 적어보세요"}
          </p>
        </button>

        {/* 기본 정보 */}
        <section className="mt-[20px]">
          <h2 className="text-center text-[16px] font-semibold text-white">
            기본 정보
          </h2>
          <button
            type="button"
            onClick={() => setBasicOpen(true)}
            className="relative mt-[10px] grid w-full grid-cols-2 rounded-[18px] border border-white/20 bg-white/10 p-[16px] text-left backdrop-blur-sm hover:bg-white/15"
          >
            <div className="absolute inset-y-[16px] left-1/2 w-px bg-white/15" />
            <InfoRows
              rows={[
                ["이름", me?.nickname ?? "—"],
                ["나이", age !== null ? `${age}세` : "—"],
                ["성별", genderLabel],
                ["직업", me?.job ?? "—"],
                ["거주지", me?.region ?? "—"],
              ]}
            />
            <InfoRows
              rows={[
                ["키", me?.height_cm ? `${me.height_cm}cm` : "—"],
                ["MBTI", me?.mbti ?? "—"],
                ["흡연", me?.smoking ?? "—"],
                ["음주", me?.drinking ?? "—"],
                ["종교", me?.religion ?? "—"],
              ]}
            />
          </button>
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
          onSave={(url) => {
            setMe((prev) => (prev ? { ...prev, photo_url: url } : prev));
            setPhotoModalOpen(false);
          }}
        />
      )}

      {bioOpen && (
        <BioEditModal
          initialBio={me?.bio ?? ""}
          onClose={() => setBioOpen(false)}
          onSaved={(bio) => {
            setMe((prev) => (prev ? { ...prev, bio } : prev));
            setBioOpen(false);
          }}
        />
      )}

      {basicOpen && me && (
        <BasicInfoEditModal
          initial={
            {
              nickname: me.nickname,
              gender: me.gender,
              birth_date: me.birth_date,
              birth_time: me.birth_time,
              calendar_type: me.calendar_type,
              is_leap_month: me.is_leap_month,
              age,
              height_cm: me.height_cm,
              mbti: me.mbti,
              job: me.job,
              region: me.region,
              religion: me.religion,
              smoking: me.smoking,
              drinking: me.drinking,
            } satisfies BasicInfoInitial
          }
          onClose={() => setBasicOpen(false)}
          onSaved={(patch) => {
            setMe((prev) =>
              prev
                ? {
                    ...prev,
                    nickname: patch.nickname ?? prev.nickname,
                    gender: patch.gender ?? prev.gender,
                    birth_date: patch.birth_date ?? prev.birth_date,
                    birth_time:
                      patch.birth_time !== undefined
                        ? patch.birth_time
                        : prev.birth_time,
                    calendar_type: patch.calendar_type ?? prev.calendar_type,
                    is_leap_month:
                      patch.is_leap_month !== undefined
                        ? patch.is_leap_month
                        : prev.is_leap_month,
                    height_cm: patch.height_cm ?? prev.height_cm,
                    mbti: patch.mbti ?? prev.mbti,
                    job: patch.job ?? prev.job,
                    region: patch.region ?? prev.region,
                    religion: patch.religion ?? prev.religion,
                    smoking: patch.smoking ?? prev.smoking,
                    drinking: patch.drinking ?? prev.drinking,
                  }
                : prev,
            );
            setBasicOpen(false);
          }}
        />
      )}

      {leaveOpen && (
        <LeaveConfirmModal
          onClose={() => (leaving ? null : setLeaveOpen(false))}
          onConfirm={confirmLeave}
          loading={leaving}
          error={leaveError}
        />
      )}
    </AppShell>
  );
}

function LeaveConfirmModal({
  onClose,
  onConfirm,
  loading,
  error,
}: {
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[300px] rounded-[16px] border border-white/15 bg-[#1f1235] p-[20px]"
      >
        <h3 className="text-center text-[16px] font-bold text-white">정말 탈퇴하시겠어요?</h3>
        <p className="mt-[10px] text-center text-[12px] leading-[18px] text-white/70">
          탈퇴 시 프로필·채팅 기록이 모두 삭제됩니다.
          <br />
          삭제 후 같은 카카오 계정으로 다시 가입할 수 있어요.
        </p>
        {error && (
          <p className="mt-[10px] text-center text-[11px] text-red-300">{error}</p>
        )}
        <div className="mt-[16px] flex gap-[8px]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-[40px] flex-1 rounded-[10px] border border-white/20 bg-white/5 text-[14px] text-white hover:bg-white/10 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="h-[40px] flex-1 rounded-[10px] bg-[rgba(255,95,95,0.9)] text-[14px] font-bold text-black hover:bg-[rgba(255,95,95,1)] disabled:opacity-50"
          >
            {loading ? "탈퇴 중..." : "탈퇴하기"}
          </button>
        </div>
      </div>
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