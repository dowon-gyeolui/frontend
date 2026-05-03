"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { ScrollableDateInput } from "@/components/common/scrollable-date-input";
import { TypingTimeInput } from "@/components/common/typing-time-input";
import { apiFetch } from "@/lib/api";
import { BIRTH_PLACE_OPTIONS } from "@/lib/birth-place";

export type RequiredInfoInitial = {
  nickname: string | null;
  gender: string | null;             // "male" | "female"
  birth_date: string | null;          // "YYYY-MM-DD"
  birth_time: string | null;          // "HH:MM" or null when unknown
  calendar_type: string | null;       // "solar" | "lunar"
  is_leap_month: boolean;
  birth_place: string | null;
  age: number | null;                 // derived — display only
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
          처음 가입할 때 입력했던 정보를 수정할 수 있어요.
        </p>

        <div className="mt-[20px] space-y-[8px]">
          {/* 이름 — 단순 한 줄 */}
          <PillRow>
            <PillInput
              label="이름"
              value={nickname}
              onChange={setNickname}
              placeholder="이름을 입력해주세요"
              maxLength={50}
            />
          </PillRow>

          {/* 성별 — 단순 한 줄 */}
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

          {/* 생년월일 — 2줄 (라벨 + 입력기 stacked). 단일 줄에 모두
              넣으면 좁은 모달에서 잘려보이므로 라벨 위 / 입력 아래로
              분리. 입력기는 compact 모드 (픽 너비 축소). */}
          <StackedRow label="생년월일">
            <ScrollableDateInput
              value={birthDate}
              onChange={setBirthDate}
              variant="light"
              compact
            />
          </StackedRow>

          {/* 달력 + 윤달 — 한 줄에 묶음 */}
          <PillRow>
            <span className="text-[14px] font-medium text-black shrink-0">달력</span>
            <div className="ml-auto flex items-center gap-[6px]">
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
              {calendar === "lunar" && (
                <label className="ml-[4px] flex cursor-pointer items-center gap-[3px] text-[12px] text-black">
                  <input
                    type="checkbox"
                    checked={isLeap}
                    onChange={(e) => setIsLeap(e.target.checked)}
                    className="size-[14px] cursor-pointer accent-[#7c3aed]"
                  />
                  윤달
                </label>
              )}
            </div>
          </PillRow>

          {/* 생시 — 2줄 (라벨 + 입력기 + 모름). 시간 입력기에 시계
              아이콘이 inset 으로 박혀있어 가로 폭이 작아도 OK 지만,
              모름 체크박스까지 넣으면 좁아지므로 stacked. */}
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

          {/* 출생지 — 단순 한 줄 (select) */}
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

/** 라벨이 위에 작게, 입력기가 아래에 오는 2-line row.
 *  생년월일/생시처럼 입력기가 가로로 길어 PillRow 안에 안 들어가는
 *  케이스 전용. 같은 wash + border + padding 으로 PillRow 와 시각
 *  통일감 유지. */
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