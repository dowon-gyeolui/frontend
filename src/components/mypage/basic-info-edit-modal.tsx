"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { BIRTH_PLACE_OPTIONS } from "@/lib/birth-place";

const SMOKING_OPTIONS = ["X", "O"] as const;
const DRINKING_OPTIONS = ["X", "1주에 1번", "1달에 1번", "자주 마심"] as const;
const RELIGION_OPTIONS = ["무교", "기독교", "불교", "천주교", "기타"] as const;

// MBTI 4 글자 각 자리에 허용되는 문자. 백엔드 검증과 동일 규칙.
// 사용자가 placeholder("MBTI") 같은 잘못된 값을 그대로 입력해 422 에러를
// 받는 사례가 있어, 클라이언트에서 먼저 차단해 친절한 메시지를 보여줌.
const MBTI_POSITION_CHARS: ReadonlyArray<ReadonlyArray<string>> = [
  ["E", "I"],
  ["N", "S"],
  ["F", "T"],
  ["J", "P"],
];

function isValidMbti(code: string): boolean {
  if (code.length !== 4) return false;
  const upper = code.toUpperCase();
  return MBTI_POSITION_CHARS.every((opts, i) => opts.includes(upper[i]));
}

// 백엔드 422 ("body" location 에 type=value_error 가 잔뜩 들어있음) 를
// 사용자가 읽을 수 있는 한국어 한 줄로 변환. 알려진 필드는 친절한 라벨,
// 모르는 건 그냥 raw 메시지 노출.
const FIELD_LABEL_KO: Record<string, string> = {
  mbti: "MBTI",
  height_cm: "키",
  job: "직업",
  region: "거주지",
  religion: "종교",
  smoking: "흡연",
  drinking: "음주",
};

type ValidationItem = { loc?: unknown[]; msg?: string };

function humanizeApiError(err: unknown): string {
  if (!(err instanceof Error)) return "저장 실패";
  const raw = err.message;
  // apiFetch 가 throw 하는 메시지가 "API 422: {json}" 형태인 경우 파싱 시도.
  const jsonStart = raw.indexOf("{");
  if (jsonStart === -1) return raw;
  try {
    const parsed = JSON.parse(raw.slice(jsonStart)) as { detail?: unknown };
    const detail = parsed.detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as ValidationItem;
      const field = Array.isArray(first.loc) ? String(first.loc[1] ?? "") : "";
      const label = FIELD_LABEL_KO[field] ?? field;
      // FastAPI value_error 메시지에서 "Value error, " prefix 제거.
      const msg = (first.msg ?? "").replace(/^Value error,\s*/i, "");
      if (label && msg) {
        // MBTI 처럼 영어 메시지가 박힌 경우 한글로 치환.
        if (field === "mbti") {
          return `MBTI는 4글자 코드로 입력해주세요 (예: ENFP, ISTJ). 모르시면 비워두세요.`;
        }
        return `${label}: ${msg}`;
      }
      return msg || raw;
    }
    if (typeof detail === "string") return detail;
  } catch {
    // JSON parsing 실패 시 raw 그대로.
  }
  return raw;
}

export type BasicInfoInitial = {
  height_cm: number | null;
  mbti: string | null;
  job: string | null;
  region: string | null;
  religion: string | null;
  smoking: string | null;
  drinking: string | null;
};

/**
 * 기본 정보 수정 modal — 매칭 카드/궁합 분석에 영향을 주는 보조 정보만.
 * 키 / MBTI / 직업 / 거주지 / 종교 / 흡연 / 음주.
 *
 * 필수 정보(이름/성별/생년월일 등)는 별도의 RequiredInfoEditModal 에서.
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
    if (mbti.trim()) {
      const code = mbti.trim().toUpperCase();
      if (!isValidMbti(code)) {
        setError(
          "MBTI는 4글자 코드로 입력해주세요 (예: ENFP, ISTJ). 모르시면 비워두세요.",
        );
        setSaving(false);
        return;
      }
      payload.mbti = code;
    }
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
        height_cm: (payload.height_cm as number | undefined) ?? null,
        mbti: (payload.mbti as string | undefined) ?? null,
        job: (payload.job as string | undefined) ?? null,
        region: (payload.region as string | undefined) ?? null,
        religion: (payload.religion as string | undefined) ?? null,
        smoking: (payload.smoking as string | undefined) ?? null,
        drinking: (payload.drinking as string | undefined) ?? null,
      });
    } catch (e) {
      setError(humanizeApiError(e));
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
          기본 정보 수정
        </h2>
        <p className="mt-[6px] text-center text-[11px] text-[#5a3a82]">
          추가 정보를 입력해주세요.
        </p>

        <div className="mt-[20px] space-y-[9px]">
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
            <span className="text-[16px] font-medium text-black shrink-0">거주지 :</span>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="flex-1 bg-transparent text-[16px] font-medium text-black focus:outline-none"
            >
              <option value="">거주지를 선택해주세요</option>
              {BIRTH_PLACE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
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