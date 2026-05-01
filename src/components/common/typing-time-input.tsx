"use client";

import { Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * 시간 입력기 (HH:MM) — 키보드 직접 타이핑 + 다이얼(native time picker)
 * 둘 다 지원하는 하이브리드.
 *
 * 레이아웃:
 *   [  HH:MM 텍스트 박스 (키보드)  ] [ 🕐 다이얼 영역 ]
 *
 * 다이얼 영역은 시계 아이콘 위에 투명한 native `<input type="time">` 가
 * absolute inset 으로 깔려있어서, 사용자가 그 영역을 탭하면 모바일에서
 * 곧바로 휠/다이얼 선택기가 뜸 (iOS Safari/Android Chrome 둘 다).
 *
 * 이전엔 시계 버튼의 onClick → showPicker() 방식이었는데, 일부 iOS 16
 * 미만 버전에서 type="time" 이 showPicker() 를 거부하는 경우가 있어서
 * 다이얼 자체가 안 떴음. native input 을 시각적으로 가리되 클릭 영역
 * 으로 살려두면 어느 환경에서도 안전하게 동작.
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

  // Helper: belt-and-braces "open the picker now". Called from the
  // visible icon area's onClick as a fallback if the overlapping native
  // input somehow doesn't receive the tap.
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

  const dialCls =
    variant === "light"
      ? "bg-black/5 text-black/60 hover:bg-black/10"
      : "bg-white/10 text-white/85 hover:bg-white/15";

  return (
    <div className="flex w-full items-center gap-[8px]">
      {/* 좌: 키보드 직접 입력용 텍스트 박스 (HH:MM 자동 포맷) */}
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
        className={`h-[52px] flex-1 rounded-[8px] px-4 text-center text-[18px] font-medium outline-none focus:border-white/60 disabled:opacity-40 ${inputCls}`}
      />

      {/* 우: 다이얼(native time picker) 영역.
          시계 아이콘 위로 native `<input type="time">` 를 투명하게
          올려서 탭 = 다이얼 오픈. iOS 어떤 버전이든 안정적으로 동작.
          시계 아이콘과 onClick fallback (showPicker) 도 같이 남겨둠. */}
      <div
        className={`relative grid h-[52px] w-[52px] flex-shrink-0 cursor-pointer place-items-center rounded-[8px] ${dialCls} ${disabled ? "opacity-40 pointer-events-none" : ""}`}
        onClick={openPicker}
        role="button"
        aria-label="다이얼로 시간 선택"
      >
        <Clock className="size-[22px]" />
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