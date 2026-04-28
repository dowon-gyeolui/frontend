"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";

const SMOKING_OPTIONS = ["X", "O"] as const;
const DRINKING_OPTIONS = ["X", "1주에 1번", "1달에 1번", "자주 마심"] as const;
const RELIGION_OPTIONS = ["무교", "기독교", "불교", "천주교", "기타"] as const;

export type BasicInfoInitial = {
  nickname: string | null;
  age: number | null;
  height_cm: number | null;
  mbti: string | null;
  job: string | null;
  region: string | null;
  religion: string | null;
  smoking: string | null;
  drinking: string | null;
};

/**
 * 기본 정보 입력 modal — Figma node 34:704.
 *
 * Glass card with stacked 304×45 pill rows for each editable field, plus
 * segmented choices for 흡연/음주. The 이름/나이 row is read-only because
 * those values come from registration / birth_date.
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

    const payload: Record<string, unknown> = {};
    if (height.trim()) {
      const n = Number(height);
      if (!Number.isFinite(n) || n < 100 || n > 250) {
        setError("키는 100~250 사이 숫자로 입력해주세요");
        setSaving(false);
        return;
      }
      payload.height_cm = n;
    }
    if (mbti.trim()) payload.mbti = mbti.trim().toUpperCase();
    if (job.trim()) payload.job = job.trim();
    if (region.trim()) payload.region = region.trim();
    if (religion) payload.religion = religion;
    if (smoking) payload.smoking = smoking;
    if (drinking) payload.drinking = drinking;

    try {
      await apiFetch("/users/me/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      onSaved({
        height_cm: payload.height_cm as number | undefined ?? null,
        mbti: (payload.mbti as string | undefined) ?? null,
        job: (payload.job as string | undefined) ?? null,
        region: (payload.region as string | undefined) ?? null,
        religion: (payload.religion as string | undefined) ?? null,
        smoking: (payload.smoking as string | undefined) ?? null,
        drinking: (payload.drinking as string | undefined) ?? null,
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
          내 정보 입력하기
        </h2>

        <div className="mt-[20px] space-y-[9px]">
          {/* Read-only 이름 + 나이 */}
          <PillRow>
            <span className="px-[6px] text-[16px] font-medium text-black">
              이름 : {initial.nickname ?? "—"} | 나이 :{" "}
              {initial.age !== null ? `${initial.age}세` : "—"}
            </span>
          </PillRow>

          {/* 키 */}
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

          {/* MBTI */}
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

          {/* 직업 */}
          <PillRow>
            <PillInput
              label="직업"
              value={job}
              onChange={setJob}
              placeholder="직업을 입력해주세요"
              maxLength={50}
            />
          </PillRow>

          {/* 거주지 */}
          <PillRow>
            <PillInput
              label="거주지"
              value={region}
              onChange={setRegion}
              placeholder="거주지를 입력해주세요(시/군)"
              maxLength={50}
            />
          </PillRow>

          {/* 종교 — segmented dropdown */}
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

          {/* 흡연 X/O */}
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

          {/* 음주 4-step */}
          <PillRow>
            <span className="text-[14px] font-medium text-black shrink-0">
              음주
            </span>
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