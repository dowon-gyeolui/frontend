"use client";

import { Calendar } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * 생년월일 입력기 — 년/월/일 3-박스 + 달력 아이콘.
 *
 * 두 가지 입력 경로를 모두 지원:
 *  1. 각 박스를 직접 탭해서 숫자를 타이핑 (4자리 연 / 2자리 월·일).
 *  2. 오른쪽 달력 아이콘을 탭하면 native `<input type="date">` 의
 *     showPicker() 가 호출돼 캘린더 위젯이 열린다.
 *
 * iOS Safari 에서는 type=date 의 dash placeholder 를 직접 탭해도 picker
 * 가 안 뜨는 경우가 있어 명시적인 아이콘 버튼이 필요. 동시에 데스크톱
 * 사용자는 키보드 타이핑이 더 빠르므로 둘 다 가능하게 둔다.
 *
 * 출력값은 `YYYY-MM-DD` ISO 문자열 (불완전한 입력 중에는 빈 문자열).
 */
export function ScrollableDateInput({
  value,
  onChange,
  minYear = 1930,
  maxYear,
  variant = "dark",
  compact = false,
}: {
  value: string;
  onChange: (next: string) => void;
  minYear?: number;
  maxYear?: number;
  /** "dark" — onboarding (purple bg). "light" — modal (white bg). */
  variant?: "dark" | "light";
  /** compact 모드 — 좁은 모달 안에서 사용. 픽 너비 축소 + 년/월/일
   *  접미사 라벨 제거. 풀-페이지에선 false. */
  compact?: boolean;
}) {
  const today = new Date();
  const cappedMaxYear = maxYear ?? today.getFullYear();

  const parsed = parseDate(value);
  const [yText, setYText] = useState(parsed ? String(parsed.y) : "");
  const [mText, setMText] = useState(parsed ? pad2(parsed.m) : "");
  const [dText, setDText] = useState(parsed ? pad2(parsed.d) : "");

  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);

  // Sync local input strings FROM the parent only when the parent's
  // value is a NEW parseable date that differs from what local state
  // currently represents. Two reasons:
  //
  //   1. Don't clear when value === "" — most often that's the user
  //      mid-typing in the day box; clearing all three fields would
  //      wipe their year/month progress too.
  //   2. Don't re-pad while typing — entering "3" in the day box
  //      causes commit() → onChange("YYYY-MM-03") → and without this
  //      check we'd setDText("03") via useEffect, dropping the "1"
  //      the user is about to type to make "31".
  //
  // Net: the effect only fires for genuine external updates (initial
  // load, native picker selection, parent reset via remount).
  useEffect(() => {
    const p = parseDate(value);
    if (!p) return;
    const localISO =
      yText.length === 4 && mText.length > 0 && dText.length > 0
        ? `${pad4(Number(yText))}-${pad2(Number(mText))}-${pad2(Number(dText))}`
        : null;
    if (localISO === value) return; // already in sync, leave typing alone
    setYText(String(p.y));
    setMText(pad2(p.m));
    setDText(pad2(p.d));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Push completed YYYY-MM-DD up to parent whenever locally-edited
  // values together form a real, in-range date.
  const commit = (y: string, m: string, d: string) => {
    if (y.length !== 4) return onChange("");
    const yi = Number(y);
    const mi = Number(m);
    const di = Number(d);
    if (
      !Number.isFinite(yi) ||
      !Number.isFinite(mi) ||
      !Number.isFinite(di) ||
      yi < minYear ||
      yi > cappedMaxYear ||
      mi < 1 ||
      mi > 12 ||
      di < 1 ||
      di > daysInMonth(yi, mi)
    ) {
      onChange("");
      return;
    }
    onChange(`${pad4(yi)}-${pad2(mi)}-${pad2(di)}`);
  };

  const openPicker = () => {
    const el = pickerRef.current;
    if (!el) return;
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

  const onlyDigits = (s: string) => s.replace(/\D/g, "");

  const onYearChange = (raw: string) => {
    const digits = onlyDigits(raw).slice(0, 4);
    setYText(digits);
    commit(digits, mText, dText);
    if (digits.length === 4) monthRef.current?.focus();
  };

  const onMonthChange = (raw: string) => {
    const digits = onlyDigits(raw).slice(0, 2);
    setMText(digits);
    commit(yText, digits, dText);
    if (digits.length === 2) dayRef.current?.focus();
  };

  const onDayChange = (raw: string) => {
    const digits = onlyDigits(raw).slice(0, 2);
    setDText(digits);
    commit(yText, mText, digits);
  };

  // compact: 좁은 모달 안 사용 — 픽 너비 줄이고 접미사 제거.
  const yWidth = compact ? 60 : 78;
  const mdWidth = compact ? 40 : 50;
  const showSuffix = !compact;
  const iconSize = compact ? 32 : 36;
  const gap = compact ? 4 : 6;

  return (
    <div
      className="relative flex items-center"
      style={{ gap: `${gap}px` }}
    >
      <PillInput
        variant={variant}
        suffix={showSuffix ? "년" : ""}
        width={yWidth}
        inputProps={{
          inputMode: "numeric",
          pattern: "[0-9]*",
          maxLength: 4,
          value: yText,
          onChange: (e) => onYearChange(e.target.value),
          placeholder: "YYYY",
          "aria-label": "출생 연도",
        }}
      />
      <PillInput
        variant={variant}
        suffix={showSuffix ? "월" : ""}
        width={mdWidth}
        inputRef={monthRef}
        inputProps={{
          inputMode: "numeric",
          pattern: "[0-9]*",
          maxLength: 2,
          value: mText,
          onChange: (e) => onMonthChange(e.target.value),
          placeholder: "MM",
          "aria-label": "출생 월",
        }}
      />
      <PillInput
        variant={variant}
        suffix={showSuffix ? "일" : ""}
        width={mdWidth}
        inputRef={dayRef}
        inputProps={{
          inputMode: "numeric",
          pattern: "[0-9]*",
          maxLength: 2,
          value: dText,
          onChange: (e) => onDayChange(e.target.value),
          placeholder: "DD",
          "aria-label": "출생 일",
        }}
      />

      {/* Calendar icon — opens native date picker for users who prefer scroll. */}
      <button
        type="button"
        onClick={openPicker}
        aria-label="달력에서 선택"
        style={{ width: iconSize, height: iconSize }}
        className={`grid flex-shrink-0 place-items-center rounded-[8px] ${
          variant === "light"
            ? "bg-white/90 hover:bg-white text-black/70"
            : "bg-white/15 hover:bg-white/25 text-white"
        }`}
      >
        <Calendar className={compact ? "size-[16px]" : "size-[18px]"} />
      </button>

      {/* Hidden native picker. We never show it directly — the icon button
          above triggers showPicker(). When the user picks, push back up. */}
      <input
        ref={pickerRef}
        type="date"
        value={value}
        min={`${minYear}-01-01`}
        max={`${cappedMaxYear}-12-31`}
        onChange={(e) => onChange(e.target.value)}
        className="absolute size-0 opacity-0 [color-scheme:dark]"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}

/**
 * One labelled pill containing an editable numeric input.
 *
 * The input is absolutely positioned to fill the entire pill box so a
 * tap anywhere on the box focuses the input. The previous version put
 * the input as a grid child with `place-items-center`, which on iOS
 * shrank the input to its content size and left a non-clickable border
 * around it — that's why tapping the day pill seemed dead.
 */
function PillInput({
  suffix,
  width,
  variant,
  inputProps,
  inputRef,
}: {
  suffix: string;
  width: number;
  variant: "dark" | "light";
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const suffixCls = variant === "light" ? "text-black/70" : "text-white/85";
  const boxCls =
    variant === "light"
      ? "bg-white border border-black/10"
      : "bg-white/85";
  return (
    <div className="flex items-center gap-[2px]">
      <div
        style={{ width }}
        className={`relative h-[36px] rounded-[8px] ${boxCls}`}
      >
        <input
          ref={inputRef}
          {...inputProps}
          type="text"
          className="absolute inset-0 size-full bg-transparent text-center text-[15px] font-semibold text-black outline-none placeholder:text-black/30"
        />
      </div>
      {suffix && (
        <span className={`text-[12px] font-medium ${suffixCls}`}>{suffix}</span>
      )}
    </div>
  );
}

function parseDate(value: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function pad4(n: number): string {
  return n.toString().padStart(4, "0");
}

function daysInMonth(year: number, month: number): number {
  // month is 1..12. Day 0 of next month = last day of given month.
  return new Date(year, month, 0).getDate();
}