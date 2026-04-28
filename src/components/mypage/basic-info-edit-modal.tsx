"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";

const SMOKING_OPTIONS = ["X", "O"] as const;
const DRINKING_OPTIONS = ["X", "1주에 1번", "1달에 1번", "자주 마심"] as const;
const RELIGION_OPTIONS = ["무교", "기독교", "불교", "천주교", "기타"] as const;

export type BasicInfoInitial = {
  // 필수 정보 — initially set on /onboarding
  nickname: string | null;
  gender: string | null;             // "male" | "female" | null
  birth_date: string | null;          // "YYYY-MM-DD"
  birth_time: string | null;          // "HH:MM" or null
  calendar_type: string | null;       // "solar" | "lunar"
  is_leap_month: boolean;
  age: number | null;                 // derived from birth_date — display only

  // 기본 정보
  height_cm: number | null;
  mbti: string | null;
  job: string | null;
  region: string | null;
  religion: string | null;
  smoking: string | null;
  drinking: string | null;
};

/**
 * 정보 수정 modal — replaces the original 기본 정보 입력 modal.
 *
 * Lets the user edit BOTH the 필수 정보 (nickname / gender / birth_date /
 * birth_time / calendar_type / is_leap_month) entered during onboarding AND
 * the secondary 기본 정보 (height / MBTI / job / region / religion / smoking
 * / drinking). Saving fires up to two PATCH calls in parallel:
 *   - PATCH /users/me/birth-data  for the 필수 정보 fields
 *   - PATCH /users/me/profile     for nickname + the 기본 정보 fields
 */
export function BasicInfoEditModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: BasicInfoInitial;
  onClose: () => void;
  onSaved: (patch: Partial<BasicInfoInitial>) => void;
}) {
  // 필수 정보
  const [nickname, setNickname] = useState(initial.nickname ?? "");
  const [gender, setGender] = useState(initial.gender ?? "");
  const [birthDate, setBirthDate] = useState(initial.birth_date ?? "");
  const [birthTime, setBirthTime] = useState(initial.birth_time ?? "");
  const [timeUnknown, setTimeUnknown] = useState(initial.birth_time === null);
  const [calendar, setCalendar] = useState(initial.calendar_type ?? "solar");
  const [isLeap, setIsLeap] = useState(initial.is_leap_month);

  // 기본 정보
  const [height, setHeight] = useState(
    initial.height_cm !== null ? String(initial.height_cm) : "",
  );
  const [mbti, setMbti] = useState(initial.mbti ?? "");
  const [job, setJob] = useState(initial.job ?? "");
  const [region, setRegion] = useState(initial.region ?? "");
  const [religion, setReligion] = useState(initial.religion ?? "");
  const [smoking, setSmoking] = useState(initial.smoking ?? "");
  const [drinking, setDrinking] = useState(initial.drinking ?? "");

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

    // Validate height before sending anything
    let heightNum: number | undefined;
    if (height.trim()) {
      const n = Number(height);
      if (!Number.isFinite(n) || n < 100 || n > 250) {
        setError("키는 100~250 사이 숫자로 입력해주세요");
        setSaving(false);
        return;
      }
      heightNum = n;
    }

    // Profile patch (nickname + secondary fields)
    const profilePayload: Record<string, unknown> = {};
    if (nickname.trim() && nickname.trim() !== initial.nickname)
      profilePayload.nickname = nickname.trim();
    if (heightNum !== undefined) profilePayload.height_cm = heightNum;
    if (mbti.trim()) profilePayload.mbti = mbti.trim().toUpperCase();
    if (job.trim()) profilePayload.job = job.trim();
    if (region.trim()) profilePayload.region = region.trim();
    if (religion) profilePayload.religion = religion;
    if (smoking) profilePayload.smoking = smoking;
    if (drinking) profilePayload.drinking = drinking;

    // Birth-data patch (필수 정보)
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
        height_cm: (profilePayload.height_cm as number | undefined) ?? null,
        mbti: (profilePayload.mbti as string | undefined) ?? null,
        job: (profilePayload.job as string | undefined) ?? null,
        region: (profilePayload.region as string | undefined) ?? null,
        religion: (profilePayload.religion as string | undefined) ?? null,
        smoking: (profilePayload.smoking as string | undefined) ?? null,
        drinking: (profilePayload.drinking as string | undefined) ?? null,
        birth_date: (birthPayload.birth_date as string | undefined) ?? null,
        birth_time:
          "birth_time" in birthPayload
            ? (birthPayload.birth_time as string | null)
            : null,
        calendar_type: (birthPayload.calendar_type as string | undefined) ?? null,
        is_leap_month: (birthPayload.is_leap_month as boolean | undefined) ?? false,
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
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          disabled={saving}
          className="absolute right-[14px] top-[14px] grid size-[24px] place-items-center"
        >
          <X className="size-[20px] stroke-[#1b1029] stroke-[2]" />
        </button>

        {/* Title */}
        <h2 className="text-center text-[20px] font-bold tracking-[-0.6px] text-[#1b1029]">
          정보 수정
        </h2>

        {/* 필수 정보 */}
        <SectionLabel>필수 정보</SectionLabel>
        <div className="space-y-[9px]">
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
            <span className="text-[16px] font-medium text-black shrink-0">생년월일 :</span>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="flex-1 bg-transparent text-[16px] font-medium text-black focus:outline-none"
            />
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

        {/* 기본 정보 */}
        <SectionLabel>기본 정보</SectionLabel>
        <div className="space-y-[9px]">
          <PillRow>
            <PillInput
              label="키"
              value={height}
              onChange={setHeight}
              placeholder="키를 입력해주세요"
              type="number"
              suffix="cm"
            />
          </PillRow>

          <PillRow>
            <PillInput
              label="MBTI"
              value={mbti}
              onChange={(v) => setMbti(v.toUpperCase())}
              placeholder="MBTI를 입력해주세요"
              maxLength={4}
              uppercase
            />
          </PillRow>

          <PillRow>
            <PillInput
              label="직업"
              value={job}
              onChange={setJob}
              placeholder="직업을 입력해주세요"
              maxLength={50}
            />
          </PillRow>

          <PillRow>
            <PillInput
              label="거주지"
              value={region}
              onChange={setRegion}
              placeholder="거주지를 입력해주세요(시/군)"
              maxLength={50}
            />
          </PillRow>

          <PillRow>
            <span className="text-[16px] font-medium text-black shrink-0">종교 :</span>
            <select
              value={religion}
              onChange={(e) => setReligion(e.target.value)}
              className="flex-1 bg-transparent text-[16px] font-medium text-black focus:outline-none"
            >
              <option value="">종교를 입력해주세요</option>
              {RELIGION_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </PillRow>

          <PillRow>
            <span className="text-[14px] font-medium text-black">
              흡연 여부를 선택해주세요
            </span>
            <div className="ml-auto flex gap-[6px]">
              {SMOKING_OPTIONS.map((o) => (
                <SegmentChip
                  key={o}
                  label={o}
                  active={smoking === o}
                  onClick={() => setSmoking(o)}
                  width={36}
                />
              ))}
            </div>
          </PillRow>

          <PillRow>
            <span className="text-[14px] font-medium text-black shrink-0">음주</span>
            <div className="ml-[6px] flex flex-1 flex-wrap items-center justify-end gap-[4px]">
              {DRINKING_OPTIONS.map((o, i) => (
                <SegmentChip
                  key={o}
                  label={o}
                  active={drinking === o}
                  onClick={() => setDrinking(o)}
                  width={i === 0 ? 32 : 60}
                  small
                />
              ))}
            </div>
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-[8px] mt-[18px] text-[12px] font-semibold uppercase tracking-wide text-[#5a3a82]">
      {children}
    </h3>
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
  type = "text",
  maxLength,
  uppercase,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: "text" | "number";
  maxLength?: number;
  uppercase?: boolean;
  suffix?: string;
}) {
  return (
    <>
      <span className="text-[16px] font-medium text-black shrink-0">
        {label} :
      </span>
      <input
        type={type}
        inputMode={type === "number" ? "numeric" : undefined}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`flex-1 bg-transparent text-[16px] font-medium text-black placeholder:text-black/45 focus:outline-none ${
          uppercase ? "uppercase tracking-widest" : ""
        }`}
      />
      {suffix && (
        <span className="text-[14px] text-black/60 shrink-0">{suffix}</span>
      )}
    </>
  );
}

function SegmentChip({
  label,
  active,
  onClick,
  width,
  small,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  width: number;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ width, height: 25 }}
      className={`grid place-items-center rounded-[18px] ${
        small ? "text-[12px]" : "text-[14px]"
      } font-medium transition ${
        active
          ? "bg-[#7c3aed] text-white shadow-[0_0_6px_rgba(124,58,237,0.5)]"
          : "bg-white/85 text-black hover:bg-white"
      }`}
    >
      {label}
    </button>
  );
}