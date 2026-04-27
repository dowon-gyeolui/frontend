"use client";

/**
 * ZAMI 워드마크 — Figma 시안의 "ZAMI + ✦ on A" 디자인을 인라인 SVG 로 재구성.
 *
 * 시안 (Figma node 4:51): "ZAMI" 텍스트의 A 글자 ▲ 머리 위에 4-pointed
 * sparkle 별이 떠 있는 형태. 큰 별 + 작은 별이 살짝 겹친 모양.
 *
 * Inline SVG 로 그렸기 때문에 외부 asset 의존 없음 (Figma URL 7-day expiry
 * 영향도 안 받음).
 */
type Size = "sm" | "md" | "lg";

const SIZE_PRESETS: Record<
  Size,
  { textPx: number; trackingEm: number; starWidthPx: number; starOffsetTop: number }
> = {
  // sm: top-bar headers (AppShell, chat room) — small but readable
  sm: { textPx: 18, trackingEm: 0.4, starWidthPx: 7, starOffsetTop: -3 },
  // md: medium pages where the logo can breathe (e.g. premium hero)
  md: { textPx: 28, trackingEm: 0.4, starWidthPx: 10, starOffsetTop: -4 },
  // lg: splash / login centerpiece
  lg: { textPx: 36, trackingEm: 0.4, starWidthPx: 14, starOffsetTop: -6 },
};

export function ZamiLogo({
  size = "sm",
  color = "#ffffff",
  className = "",
}: {
  size?: Size;
  color?: string;
  className?: string;
}) {
  const preset = SIZE_PRESETS[size];

  return (
    <span
      className={`relative inline-flex items-center font-bold leading-none ${className}`}
      style={{
        fontFamily: "'Jalnan Gothic TTF', 'Pretendard Variable', sans-serif",
        fontSize: `${preset.textPx}px`,
        letterSpacing: `${preset.trackingEm}em`,
        color,
      }}
    >
      ZAMI
      {/* Sparkle floats above the "A". The 4-letter word with 0.4em tracking
          puts A at roughly 38% of the width; nudge with translateX. */}
      <SparkleAccent
        widthPx={preset.starWidthPx}
        offsetTopPx={preset.starOffsetTop}
        color={color}
      />
    </span>
  );
}

function SparkleAccent({
  widthPx,
  offsetTopPx,
  color,
}: {
  widthPx: number;
  offsetTopPx: number;
  color: string;
}) {
  const heightPx = widthPx * 2; // tall 4-pointed star (Figma 16x31 ≈ 1:2)
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{
        // Position: above the A glyph. ZAMI letters have natural advance widths
        // so we approximate centre-of-A at ~40% of the rendered text width.
        // The translate-x compensates for tracking.
        left: "39%",
        top: `${offsetTopPx}px`,
        width: `${widthPx}px`,
        height: `${heightPx}px`,
        transform: "translateX(-50%)",
      }}
    >
      <svg
        viewBox="0 0 16 32"
        width={widthPx}
        height={heightPx}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Big 4-pointed sparkle — narrow vertical diamond with concave sides */}
        <path
          d="M8 0
             C 8 10, 8 12, 14 16
             C 8 20, 8 22, 8 32
             C 8 22, 8 20, 2 16
             C 8 12, 8 10, 8 0 Z"
          fill={color}
        />
        {/* Tiny inner sparkle — extra accent right below the big one */}
        <circle cx="8" cy="22" r="1.4" fill={color} />
      </svg>
    </span>
  );
}