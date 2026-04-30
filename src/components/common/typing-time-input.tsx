"use client";

import { Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * 시간 입력기 (HH:MM) — 직접 타이핑 + native time picker 둘 다 지원.
 *
 * iOS Safari 의 `<input type="time">` 은 placeholder dash 영역을 탭해도
 * picker 가 안 뜨고 우측 시계 아이콘만 동작하는 케이스가 있어, 명시적
 * 텍스트 입력 + 시계 버튼으로 분리했다.
 *
 *   - 텍스트 박스: 4자리 숫자 입력. 두 자리 입력하면 자동으로 ":" 삽입.
 *   - 시계 버튼: native `<input type="time">` 의 showPicker() 호출.
 *
 * 출력값은 `HH:MM` (24h, 0-padded) 또는 빈 문자열.
 */
export function TypingTimeInput({
  value,
  onChange,
  disabled = false,
  variant = "dark",
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  /** "dark" — purple bg pages. "light" — white modal. */
  variant?: "dark" | "light";
}) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  const commit = (next: string) => {
    if (/^\d{2}:\d{2}$/.test(next)) {
      const [h, m] = next.split(":").map(Number);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        onChange(next);
        return;
      }
    }
    onChange("");
  };

  const onTextChange = (raw: string) => {
    // Strip all non-digits, then auto-format HH:MM as the user types.
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    let next = digits;
    if (digits.length >= 3) next = `${digits.slice(0, 2)}:${digits.slice(2)}`;
    else if (digits.length === 2 && raw.endsWith(":")) next = `${digits}:`;
    setText(next);
    commit(next);
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

  const inputCls =
    variant === "light"
      ? "bg-white border border-black/10 text-black placeholder:text-black/30"
      : "bg-[#352052] border border-[#5a3a82] text-white placeholder:text-white/45";

  return (
    <div className="relative flex w-full items-center gap-[8px]">
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9:]*"
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        onBlur={() => commit(text)}
        disabled={disabled}
        placeholder="HH:MM"
        aria-label="출생 시간"
        className={`h-[52px] flex-1 rounded-[8px] px-4 text-center text-[18px] font-medium outline-none focus:border-white/60 disabled:opacity-40 ${inputCls}`}
      />
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        aria-label="시간 선택"
        className={`grid size-[52px] flex-shrink-0 place-items-center rounded-[8px] ${
          variant === "light"
            ? "bg-white/90 text-black/70 hover:bg-white"
            : "bg-white/15 text-white hover:bg-white/25"
        } disabled:opacity-40`}
      >
        <Clock className="size-[20px]" />
      </button>

      {/* Hidden native time picker. The clock button triggers showPicker(). */}
      <input
        ref={pickerRef}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute size-0 opacity-0 [color-scheme:dark]"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}