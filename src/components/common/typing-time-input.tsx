"use client";

import { Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * 시간 입력기 (HH:MM) — 키보드 직접 타이핑 + 다이얼(native time picker).
 *
 * 한 박스 안에 모두 들어있는 단일 컴포넌트:
 *   ┌─────────────────────────────────┐
 *   │     HH:MM         🕐(다이얼)    │
 *   └─────────────────────────────────┘
 *
 * - 좌측 본문: 키보드 타이핑. 두 자리 입력하면 자동으로 ":" 삽입.
 * - 우측 시계 아이콘: 그 영역 위로 native `<input type="time">` 가
 *   absolute inset 으로 깔려있어 탭 = 모바일 다이얼 picker 즉시 오픈.
 *
 * 이전엔 시계 영역을 flex 의 두 번째 자식(별도 박스)으로 뒀는데, 좁은
 * iOS Safari 뷰포트에서 시계 박스가 우측으로 밀려나 화면 밖으로
 * 잘렸음. 박스 내부 inset 으로 가져와 어떤 폭에서도 보이도록 보장.
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

  // Belt-and-braces fallback: if the overlapping native input doesn't
  // receive the tap (some iOS versions), the icon area's onClick still
  // tries showPicker() to force the dial open.
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
    variant === "light" ? "text-black/65" : "text-white/85";

  return (
    <div className="relative w-full">
      {/* Text input — extra right padding (pr-[52px]) reserves the
          space the clock icon overlays so the typed digits never sit
          underneath it. */}
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

      {/* Clock area — sits inside the text input on the right. The
          visible icon is purely cosmetic; the native time input on top
          captures the tap and opens the dial. */}
      <div
        onClick={openPicker}
        role="button"
        aria-label="다이얼로 시간 선택"
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
          aria-label="출생 시간 (다이얼)"
        />
      </div>
    </div>
  );
}