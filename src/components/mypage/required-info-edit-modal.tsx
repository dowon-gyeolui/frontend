"use client";
// 역할 설명: 마이페이지에서 생시/출생지 등 필수 정보 일부를 수정하는 모달

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { TypingTimeInput } from "@/components/common/typing-time-input";
import { apiFetch } from "@/lib/api";
import { BIRTH_PLACE_OPTIONS } from "@/lib/birth-place";

export type RequiredInfoInitial = {
  nickname: string | null;
  gender: string | null;
  birth_date: string | null;
  birth_time: string | null;
  calendar_type: string | null;
  is_leap_month: boolean;
  birth_place: string | null;
  age: number | null;
};

export type RequiredInfoPatch = {
  nickname?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  birth_time?: string | null;
  calendar_type?: string | null;
  is_leap_month?: boolean;
  birth_place?: string | null;
};

export function RequiredInfoEditModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: RequiredInfoInitial;
  onClose: () => void;
  onSaved: (patch: RequiredInfoPatch) => void;
}) {
  const [nickname] = useState(initial.nickname ?? "");
  const [gender] = useState(initial.gender ?? "");
  const [birthDate] = useState(initial.birth_date ?? "");
  const [birthTime, setBirthTime] = useState(initial.birth_time ?? "");
  const [timeUnknown, setTimeUnknown] = useState(initial.birth_time === null);
  const [calendar] = useState(initial.calendar_type ?? "solar");
  const [isLeap] = useState(initial.is_leap_month);
  const [birthPlace, setBirthPlace] = useState(initial.birth_place ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);

    const profilePayload: Record<string, unknown> = {};
    if (nickname.trim() && nickname.trim() !== initial.nickname)
      profilePayload.nickname = nickname.trim();

    const birthPayload: Record<string, unknown> = {};
    if (birthDate && birthDate !== initial.birth_date)
      birthPayload.birth_date = birthDate;
    if (timeUnknown) {
      if (initial.birth_time !== null) birthPayload.birth_time = null;
    } else if (birthTime && birthTime !== initial.birth_time) {
      birthPayload.birth_time = birthTime;
    }
    if (calendar !== initial.calendar_type) birthPayload.calendar_type = calendar;
    if (isLeap !== initial.is_leap_month) birthPayload.is_leap_month = isLeap;
    if (gender && gender !== initial.gender) birthPayload.gender = gender;
    if (birthPlace !== (initial.birth_place ?? "")) {
      birthPayload.birth_place = birthPlace || null;
    }

    try {
      const requests: Promise<unknown>[] = [];
      if (Object.keys(profilePayload).length > 0) {
        requests.push(
          apiFetch("/users/me/profile", {
            method: "PATCH",
            body: JSON.stringify(profilePayload),
          }),
        );
      }
      if (Object.keys(birthPayload).length > 0) {
        requests.push(
          apiFetch("/users/me/birth-data", {
            method: "PATCH",
            body: JSON.stringify(birthPayload),
          }),
        );
      }
      await Promise.all(requests);

      onSaved({
        nickname: (profilePayload.nickname as string | undefined) ?? null,
        birth_date: (birthPayload.birth_date as string | undefined) ?? null,
        birth_time:
          "birth_time" in birthPayload
            ? (birthPayload.birth_time as string | null)
            : null,
        calendar_type: (birthPayload.calendar_type as string | undefined) ?? null,
        is_leap_month:
          (birthPayload.is_leap_month as boolean | undefined) ?? undefined,
        gender: (birthPayload.gender as string | undefined) ?? null,
        birth_place:
          "birth_place" in birthPayload
            ? (birthPayload.birth_place as string | null)
            : null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(27,16,41,0.4)] backdrop-blur-[2px] p-[20px]"
      onClick={() => (saving ? null : onClose())}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90dvh] w-[341px] max-w-full overflow-y-auto rounded-[18px] border border-white/20 bg-white/70 px-[18px] pb-[24px] pt-[28px] backdrop-blur-[25px] shadow-[0_10px_40px_rgba(0,0,0,0.3)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          disabled={saving}
          className="absolute right-[14px] top-[14px] grid size-[24px] place-items-center"
        >
          <X className="size-[20px] stroke-[#1b1029] stroke-[2]" />
        </button>

        <h2 className="text-center text-[20px] font-bold tracking-[-0.6px] text-[#1b1029]">
          필수 정보 수정
        </h2>
        <p className="mt-[6px] text-center text-[11px] text-[#5a3a82]">
          생시와 출생지만 수정할 수 있어요. 이름·성별·생년월일은 변경할 수 없어요.
        </p>

        <div className="mt-[20px] space-y-[8px]">
          <PillRow>
            <span className="text-[16px] font-medium text-black shrink-0">이름 :</span>
            <span className="flex-1 text-[16px] font-medium text-black">
              {nickname || "—"}
            </span>
            <span className="shrink-0 text-[11px] text-black/40">수정 불가</span>
          </PillRow>

          <PillRow>
            <span className="text-[14px] font-medium text-black shrink-0">성별</span>
            <span className="ml-auto text-[14px] font-medium text-black">
              {gender === "male" ? "남자" : gender === "female" ? "여자" : "—"}
            </span>
            <span className="ml-[8px] shrink-0 text-[11px] text-black/40">수정 불가</span>
          </PillRow>

          <StackedRow label="생년월일">
            <div className="flex items-baseline justify-between">
              <span className="text-[15px] font-medium text-black">
                {birthDate || "—"}
                {initial.age !== null && (
                  <span className="ml-[5px] text-[13px] text-black/60">
                    (만 {initial.age}세)
                  </span>
                )}
                <span className="ml-[6px] text-[12px] text-black/55">
                  · {calendar === "lunar" ? `음력${isLeap ? " 윤달" : ""}` : "양력"}
                </span>
              </span>
              <span className="shrink-0 text-[11px] text-black/40">수정 불가</span>
            </div>
            <p className="text-[10px] text-black/45">
              ZAMI는 만 나이를 기준으로 합니다.
            </p>
          </StackedRow>

          <StackedRow label="생시">
            <div className="flex items-center gap-[10px]">
              <div className="flex-1">
                <TypingTimeInput
                  value={birthTime}
                  disabled={timeUnknown}
                  variant="light"
                  onChange={(next) => {
                    setBirthTime(next);
                    if (next) setTimeUnknown(false);
                  }}
                />
              </div>
              <label className="flex shrink-0 cursor-pointer items-center gap-[4px] text-[12px] text-black">
                <input
                  type="checkbox"
                  checked={timeUnknown}
                  onChange={(e) => {
                    setTimeUnknown(e.target.checked);
                    if (e.target.checked) setBirthTime("");
                  }}
                  className="size-[14px] cursor-pointer accent-[#7c3aed]"
                />
                모름
              </label>
            </div>
          </StackedRow>

          <PillRow>
            <span className="text-[14px] font-medium text-black shrink-0">출생지</span>
            <select
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
              className="ml-auto bg-transparent text-right text-[14px] font-medium text-black focus:outline-none"
            >
              <option value="">선택 안 함</option>
              {BIRTH_PLACE_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </PillRow>

        </div>

        {error && (
          <p className="mt-[10px] text-center text-[11px] text-red-500">{error}</p>
        )}

        <div className="mt-[18px] flex justify-center">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="grid h-[34px] w-[160px] place-items-center rounded-[18px] text-[16px] font-semibold text-white shadow-[0_0_8px_2px_#7f55b4] disabled:opacity-50"
            style={{
              backgroundImage:
                "linear-gradient(97deg, rgb(124, 58, 237) 0%, rgb(168, 85, 247) 100%)",
            }}
          >
            {saving ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PillRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[45px] items-center gap-[8px] rounded-[12px] border border-white/20 bg-white/55 px-[16px] backdrop-blur-[5px]">
      {children}
    </div>
  );
}

function StackedRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[6px] rounded-[12px] border border-white/20 bg-white/55 px-[16px] py-[10px] backdrop-blur-[5px]">
      <span className="text-[12px] font-medium text-black/65">{label}</span>
      {children}
    </div>
  );
}

