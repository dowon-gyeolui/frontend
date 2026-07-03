"use client";
// 출생 시간 입력기 (HH:MM) — 키보드 직접 타이핑 + native time picker 다이얼.

import { Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function TypingTimeInput({
  value,
  onChange,
  disabled = false,
  variant = "dark",
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
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
    variant === "light" ? "text-black/65" : "text-white/85";

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
        aria-label="출생 시간 (직접 입력)"
        className={`h-[52px] w-full rounded-[8px] px-4 pr-[52px] text-center text-[18px] font-medium outline-none focus:border-white/60 disabled:opacity-40 ${inputCls}`}
      />

      <div
        onClick={openPicker}
        role="button"
        aria-label="시간 선택"
        className={`absolute right-[6px] top-1/2 grid size-[40px] -translate-y-1/2 cursor-pointer place-items-center rounded-[6px] ${disabled ? "pointer-events-none opacity-40" : ""}`}
      >
        <Clock className={`size-[20px] ${iconCls}`} />
        <input
          ref={pickerRef}
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="absolute inset-0 size-full cursor-pointer opacity-0 [color-scheme:dark]"
          aria-label="출생 시간 선택"
        />
      </div>
    </div>
  );
}