"use client";

import { useRef } from "react";

/**
 * 생년월일 입력기 — 시각적으론 년/월/일 3-박스, 누르면 네이티브 달력
 * picker 가 뜬다.
 *
 * 모바일에서는 native `<input type="date">` 의 캘린더 위젯이 가장 익숙해서
 * 이를 보이지 않게 깔아두고 시각적으로 3개 박스만 표시. 어떤 박스를
 * 눌러도 `showPicker()` 가 호출돼 캘린더가 뜬다.
 *
 * 출력값은 `YYYY-MM-DD` ISO 문자열 (또는 빈 문자열).
 */
export function ScrollableDateInput({
  value,
  onChange,
  minYear = 1930,
  maxYear,
  variant = "dark",
}: {
  value: string;
  onChange: (next: string) => void;
  minYear?: number;
  maxYear?: number;
  /** "dark" — onboarding (purple bg). "light" — modal (white bg). */
  variant?: "dark" | "light";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const today = new Date();
  const cappedMaxYear = maxYear ?? today.getFullYear();

  const parsed = parseDate(value);
  const yLabel = parsed?.y.toString() ?? "----";
  const mLabel = parsed ? parsed.m.toString() : "--";
  const dLabel = parsed ? parsed.d.toString() : "--";

  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    // showPicker() 가 모바일/데스크톱 modern 브라우저에서 동작.
    // 미지원 환경은 focus + click 으로 폴백.
    if (typeof el.showPicker === "function") {
      try {
        el.showPicker();
        return;
      } catch {
        /* fall through */
      }
    }
    el.focus();
    el.click();
  };

  return (
    <div
      onClick={openPicker}
      className="relative flex cursor-pointer items-center gap-[6px]"
    >
      <input
        ref={inputRef}
        type="date"
        value={value}
        min={`${minYear}-01-01`}
        max={`${cappedMaxYear}-12-31`}
        onChange={(e) => onChange(e.target.value)}
        // 시각적으로는 숨기되 click target 으로는 살아있게.
        // pointer-events-none 으로 두면 모바일 picker 가 안 뜨므로
        // opacity-0 + 절대위치 + size-full 로 처리.
        className="absolute inset-0 cursor-pointer opacity-0 [color-scheme:dark]"
        aria-label="생년월일"
      />
      <Pill text={`${yLabel}`} suffix="년" width={70} active={!!parsed} variant={variant} />
      <Pill text={`${mLabel}`} suffix="월" width={50} active={!!parsed} variant={variant} />
      <Pill text={`${dLabel}`} suffix="일" width={50} active={!!parsed} variant={variant} />
    </div>
  );
}

function parseDate(value: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

function Pill({
  text,
  suffix,
  width,
  active,
  variant,
}: {
  text: string;
  suffix: string;
  width: number;
  active: boolean;
  variant: "dark" | "light";
}) {
  const suffixCls =
    variant === "light"
      ? "text-black/70"
      : "text-white/85";
  const boxCls =
    variant === "light"
      ? "bg-white border border-black/10"
      : "bg-white/85";
  return (
    <span className="flex items-center gap-[2px]">
      <span
        style={{ width }}
        className={`grid h-[36px] place-items-center rounded-[8px] text-center text-[15px] font-semibold ${boxCls} ${
          active ? "text-black" : "text-black/35"
        }`}
      >
        {text}
      </span>
      <span className={`text-[12px] font-medium ${suffixCls}`}>{suffix}</span>
    </span>
  );
}