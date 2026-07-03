"use client";
// 생년월일 입력기 — 년/월/일 직접 타이핑 + 달력 아이콘으로 native date picker 열기.

import { Calendar } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
  variant?: "dark" | "light";
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

  useEffect(() => {
    const p = parseDate(value);
    if (!p) return;
    const localISO =
      yText.length === 4 && mText.length > 0 && dText.length > 0
        ? `${pad4(Number(yText))}-${pad2(Number(mText))}-${pad2(Number(dText))}`
        : null;
    if (localISO === value) return;
    setYText(String(p.y));
    setMText(pad2(p.m));
    setDText(pad2(p.d));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

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
  return new Date(year, month, 0).getDate();
}