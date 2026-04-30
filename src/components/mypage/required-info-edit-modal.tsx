"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { ScrollableDateInput } from "@/components/common/scrollable-date-input";
import { apiFetch } from "@/lib/api";

export type RequiredInfoInitial = {
  nickname: string | null;
  gender: string | null;             // "male" | "female"
  birth_date: string | null;          // "YYYY-MM-DD"
  birth_time: string | null;          // "HH:MM" or null when unknown
  calendar_type: string | null;       // "solar" | "lunar"
  is_leap_month: boolean;
  age: number | null;                 // derived — display only
};

export type RequiredInfoPatch = {
  nickname?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  birth_time?: string | null;
  calendar_type?: string | null;
  is_leap_month?: boolean;
};

/**
 * 필수 정보 수정 modal — onboarding 시 입력했던 핵심 정보만 다룬다.
 * 이름·성별·생년월일·생시·달력·윤달.
 *
 * 기본 정보(키/MBTI/직업 등)는 별도의 BasicInfoEditModal 에서 다룬다.
 */
export function RequiredInfoEditModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: RequiredInfoInitial;
  onClose: () => void;
  onSaved: (patch: RequiredInfoPatch) => void;
}) {
  const [nickname, setNickname] = useState(initial.nickname ?? "");
  const [gender, setGender] = useState(initial.gender ?? "");
  const [birthDate, setBirthDate] = useState(initial.birth_date ?? "");
  const [birthTime, setBirthTime] = useState(initial.birth_time ?? "");
  const [timeUnknown, setTimeUnknown] = useState(initial.birth_time === null);
  const [calendar, setCalendar] = useState(initial.calendar_type ?? "solar");
  const [isLeap, setIsLeap] = useState(initial.is_leap_month);
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
          처음 가입할 때 입력했던 정보를 수정할 수 있어요.
        </p>

        <div className="mt-[20px] space-y-[9px]">
          <PillRow>
            <PillInput
              label="이름"
              value={nickname}
              onChange={setNickname}
              placeholder="이름을 입력해주세요"
              maxLength={50}
            />
          </PillRow>

          <PillRow>
            <span className="text-[14px] font-medium text-black shrink-0">성별</span>
            <div className="ml-auto flex gap-[6px]">
              <SegmentChip
                label="남자"
                active={gender === "male"}
                onClick={() => setGender("male")}
                width={56}
              />
              <SegmentChip
                label="여자"
                active={gender === "female"}
                onClick={() => setGender("female")}
                width={56}
              />
            </div>
          </PillRow>

          <PillRow>
            <span className="text-[16px] font-medium text-black shrink-0">생년월일</span>
            <div className="ml-auto">
              <ScrollableDateInput value={birthDate} onChange={setBirthDate} />
            </div>
          </PillRow>

          <PillRow>
            <span className="text-[14px] font-medium text-black shrink-0">달력</span>
            <div className="ml-auto flex gap-[6px]">
              <SegmentChip
                label="양력"
                active={calendar === "solar"}
                onClick={() => {
                  setCalendar("solar");
                  setIsLeap(false);
                }}
                width={50}
              />
              <SegmentChip
                label="음력"
                active={calendar === "lunar"}
                onClick={() => setCalendar("lunar")}
                width={50}
              />
            </div>
          </PillRow>

          {calendar === "lunar" && (
            <PillRow>
              <span className="text-[14px] font-medium text-black">윤달</span>
              <input
                type="checkbox"
                checked={isLeap}
                onChange={(e) => setIsLeap(e.target.checked)}
                className="ml-auto size-[16px] cursor-pointer accent-[#7c3aed]"
              />
            </PillRow>
          )}

          <PillRow>
            <span className="text-[16px] font-medium text-black shrink-0">생시 :</span>
            <input
              type="time"
              value={birthTime}
              disabled={timeUnknown}
              onChange={(e) => {
                setBirthTime(e.target.value);
                setTimeUnknown(false);
              }}
              className="flex-1 bg-transparent text-[16px] font-medium text-black focus:outline-none disabled:opacity-50"
            />
            <label className="flex cursor-pointer items-center gap-[4px] text-[12px] text-black">
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
          </PillRow>

          {initial.age !== null && (
            <p className="px-[6px] text-right text-[11px] text-black/55">
              나이: {initial.age}세
            </p>
          )}
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

function PillInput({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxLength?: number;
}) {
  return (
    <>
      <span className="text-[16px] font-medium text-black shrink-0">
        {label} :
      </span>
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-[16px] font-medium text-black placeholder:text-black/45 focus:outline-none"
      />
    </>
  );
}

function SegmentChip({
  label,
  active,
  onClick,
  width,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  width: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ width, height: 25 }}
      className={`grid place-items-center rounded-[18px] text-[14px] font-medium transition ${
        active
          ? "bg-[#7c3aed] text-white shadow-[0_0_6px_rgba(124,58,237,0.5)]"
          : "bg-white/85 text-black hover:bg-white"
      }`}
    >
      {label}
    </button>
  );
}