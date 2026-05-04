"use client";

import { Info, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { GlossaryEntry } from "@/lib/saju-glossary-data";

/**
 * Tappable pill that pops a small explanation card on tap. Used wherever
 * we surface a saju term ("정재", "도화 발동", "오늘 일주 기묘"...) so
 * users who don't know the jargon can read a plain-Korean meaning in place.
 *
 * The popup is anchored absolute to the badge, on top of surrounding
 * content. Tap-outside / X / Esc closes it.
 */
export function InfoBadge({
  label,
  entry,
  variant = "default",
  showInfoIcon = true,
}: {
  /** Visible label on the pill (e.g. "도화 발동", "★★★★★ 정재"). */
  label: string;
  /** The glossary entry to show in the popup. */
  entry: GlossaryEntry;
  /** Color variant. */
  variant?: "default" | "yellow" | "muted";
  /** Whether to show the small info-icon hint after the label. */
  showInfoIcon?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDocPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDocPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pillClass =
    variant === "yellow"
      ? "bg-[#fde047]/15 text-[#fde047]"
      : variant === "muted"
        ? "bg-white/10 text-white/70"
        : "bg-white/15 text-white/85";

  return (
    <div ref={wrapRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`inline-flex items-center gap-[4px] rounded-full px-[8px] py-[2px] text-[10px] font-medium transition hover:brightness-110 ${pillClass}`}
      >
        <span>{label}</span>
        {showInfoIcon && <Info className="size-[10px] opacity-70" />}
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute left-1/2 top-[calc(100%+6px)] z-50 w-[240px] -translate-x-1/2 rounded-[12px] border border-white/20 bg-[#1a1430]/95 p-[12px] text-left shadow-[0_8px_24px_-4px_rgba(0,0,0,0.6)] backdrop-blur-md"
        >
          <div className="flex items-start justify-between gap-[8px]">
            <h4 className="text-[12px] font-bold text-white">{entry.title}</h4>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="닫기"
              className="text-white/50 hover:text-white"
            >
              <X className="size-[14px]" />
            </button>
          </div>
          <p className="mt-[6px] text-[11px] leading-[17px] text-white/80">
            {entry.body}
          </p>
        </div>
      )}
    </div>
  );
}