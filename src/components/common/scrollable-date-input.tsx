"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 스크롤 가능한 생년월일 입력기.
 *
 * Native `<input type="date">` 는 모바일 OS 위젯에서 연도만 휠/스와이프로
 * 변경할 수 있는 경우가 많아 월·일을 바꾸기 어려워. 그래서 년/월/일을
 * 각각 작은 숫자 입력 박스로 분리하고, 각 박스 위에서 마우스 휠 또는
 * 키보드 ↑/↓ 으로 값을 1씩 변경할 수 있게 만들었다.
 *
 * 출력값은 `YYYY-MM-DD` ISO 문자열. 비어있으면 빈 문자열.
 */
export function ScrollableDateInput({
  value,
  onChange,
  minYear = 1930,
  maxYear,
}: {
  value: string;
  onChange: (next: string) => void;
  minYear?: number;
  maxYear?: number;
}) {
  const today = new Date();
  const cappedMaxYear = maxYear ?? today.getFullYear();

  // Parse incoming value once per change. Empty → today's date as initial.
  const [{ y, m, d }, setParts] = useState(() => parseDate(value, today));

  // Keep local state in sync if parent value changes externally.
  useEffect(() => {
    const parsed = parseDate(value, today);
    setParts((prev) =>
      prev.y === parsed.y && prev.m === parsed.m && prev.d === parsed.d
        ? prev
        : parsed,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emit = (ny: number, nm: number, nd: number) => {
    const daysInMonth = new Date(ny, nm, 0).getDate();
    const cd = Math.min(Math.max(1, nd), daysInMonth);
    setParts({ y: ny, m: nm, d: cd });
    onChange(`${ny.toString().padStart(4, "0")}-${nm.toString().padStart(2, "0")}-${cd.toString().padStart(2, "0")}`);
  };

  return (
    <div className="flex items-center gap-[6px]">
      <Segment
        value={y}
        min={minYear}
        max={cappedMaxYear}
        width={64}
        suffix="년"
        onChange={(v) => emit(v, m, d)}
      />
      <Segment
        value={m}
        min={1}
        max={12}
        width={48}
        suffix="월"
        onChange={(v) => emit(y, v, d)}
      />
      <Segment
        value={d}
        min={1}
        max={new Date(y, m, 0).getDate()}
        width={48}
        suffix="일"
        onChange={(v) => emit(y, m, v)}
      />
    </div>
  );
}

function parseDate(value: string, fallback: Date): { y: number; m: number; d: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) {
    return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
  }
  return {
    y: fallback.getFullYear(),
    m: fallback.getMonth() + 1,
    d: fallback.getDate(),
  };
}

function Segment({
  value,
  min,
  max,
  width,
  suffix,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  width: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const clamp = (n: number) => Math.min(Math.max(n, min), max);

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    if (document.activeElement !== ref.current) return; // only when focused
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1; // wheel up → increase
    onChange(clamp(value + delta));
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      onChange(clamp(value + 1));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onChange(clamp(value - 1));
    }
  };

  return (
    <label className="flex items-center gap-[2px]">
      <input
        ref={ref}
        type="number"
        inputMode="numeric"
        value={value}
        min={min}
        max={max}
        style={{ width }}
        onWheel={handleWheel}
        onKeyDown={handleKey}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(clamp(n));
        }}
        className="h-[36px] rounded-[8px] bg-white/80 px-[8px] text-center text-[15px] font-semibold text-black focus:bg-white focus:outline-none"
      />
      <span className="text-[12px] font-medium text-black/70">{suffix}</span>
    </label>
  );
}