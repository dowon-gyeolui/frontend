"use client";

import { Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * 시간 입력기 (HH:MM) — 직접 타이핑 + native time picker.
 *
 * 입력 박스는 한 칸 (text input). 시계 아이콘은 박스 *내부* 우측에
 * inset 으로 배치 — 화면이 좁아도 잘리지 않게 보장.
 *
 *   - 박스 본문: 4자리 숫자 입력. 두 자리 입력하면 자동으로 ":" 삽입.
 *   - 시계 아이콘 버튼: native `<input type="time">` 의 showPicker() 호출.
 *
 * 이전 버전은 input 옆에 시계 버튼을 별도 flex 자식으로 배치했는데,
 * iOS 좁은 viewport 에서 input 이 안 줄어들고 버튼이 화면 밖으로
 * 밀려났음. inset 배치로 그 문제 회피.
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

  const iconCls =
    variant === "light"
      ? "text-black/60 hover:bg-black/5"
      : "text-white/85 hover:bg-white/10";

  return (
    <div className="relative w-full">
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
        className={`h-[52px] w-full rounded-[8px] px-4 pr-[52px] text-center text-[18px] font-medium outline-none focus:border-white/60 disabled:opacity-40 ${inputCls}`}
      />
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        aria-label="시간 선택"
        className={`absolute right-[6px] top-1/2 grid size-[40px] -translate-y-1/2 place-items-center rounded-[6px] disabled:opacity-40 ${iconCls}`}
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