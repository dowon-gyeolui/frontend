"use client";

/**
 * ZAMI 워드마크 — Figma node 14:1910 기준.
 *
 * 디자인: "ZAMI" 흰색 텍스트(Jalnan Gothic) + A·M 사이 위치의 노란색
 * 세로형 4-point sparkle + 그 안쪽 아래에 작은 동심 sparkle.
 *
 * 인라인 SVG 로 그렸기 때문에 외부 asset 의존 없음 (Figma asset URL 의
 * 7-day expiry 영향도 받지 않음).
 */
type Size = "sm" | "md" | "lg";

type Preset = {
  textPx: number;
  trackingEm: number;
  /** Visible sparkle height (px). 1:1.6 wide-to-tall ratio retained. */
  sparkleHeightPx: number;
  /** Horizontal offset from start of ZAMI text. ~35% lands the sparkle
   *  inside the A glyph (4-letter ZAMI: Z=12.5%, A≈37%, M≈63%, I=87.5%). */
  sparkleLeftPct: number;
  /** Vertical offset of sparkle top relative to the text top. Negative
   *  = above baseline. */
  sparkleTopOffsetPx: number;
};

const SIZE_PRESETS: Record<Size, Preset> = {
  sm: {
    textPx: 18,
    trackingEm: 0.4,
    sparkleHeightPx: 12,
    sparkleLeftPct: 35,
    sparkleTopOffsetPx: 5,
  },
  md: {
    textPx: 28,
    trackingEm: 0.4,
    sparkleHeightPx: 19,
    sparkleLeftPct: 35,
    sparkleTopOffsetPx: 8,
  },
  lg: {
    textPx: 36,
    trackingEm: 0.4,
    sparkleHeightPx: 24,
    sparkleLeftPct: 35,
    sparkleTopOffsetPx: 11,
  },
};

const ACCENT = "#fde047"; // tailwind yellow-300, used elsewhere in the app

export function ZamiLogo({
  size = "sm",
  color = "#ffffff",
  accentColor = ACCENT,
  className = "",
}: {
  size?: Size;
  /** ZAMI 텍스트 색 */
  color?: string;
  /** Sparkle 색 — 기본은 노란색 (Figma 시안 기준) */
  accentColor?: string;
  className?: string;
}) {
  const preset = SIZE_PRESETS[size];
  const sparkleWidth = preset.sparkleHeightPx * (16 / 31); // Figma 16:31 box ratio

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
      <span
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          left: `${preset.sparkleLeftPct}%`,
          top: `${preset.sparkleTopOffsetPx}px`,
          width: `${sparkleWidth}px`,
          height: `${preset.sparkleHeightPx}px`,
          transform: "translateX(-50%)",
        }}
      >
        <BigSparkle color={accentColor} />
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          // Small accent shares the big sparkle's horizontal centre
          // (Figma node 14:1913 sits exactly under 14:1912's center).
          left: `${preset.sparkleLeftPct}%`,
          top: `${preset.sparkleTopOffsetPx + preset.sparkleHeightPx * 0.55}px`,
          width: `${sparkleWidth * 0.55}px`,
          height: `${sparkleWidth * 0.55}px`,
          transform: "translateX(-50%)",
        }}
      >
        <SmallSparkle color={accentColor} />
      </span>
    </span>
  );
}

function BigSparkle({ color }: { color: string }) {
  // Tall 4-pointed sparkle — concave-sided diamond.
  return (
    <svg
      viewBox="0 0 14 23"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <path
        d="M7 0
           C 7 7, 7 9, 12.5 11.5
           C 7 14, 7 16, 7 23
           C 7 16, 7 14, 1.5 11.5
           C 7 9, 7 7, 7 0 Z"
        fill={color}
      />
    </svg>
  );
}

function SmallSparkle({ color }: { color: string }) {
  // Compact 4-point twinkle — used as the inner accent. Square box.
  return (
    <svg
      viewBox="0 0 10 10"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 0
           C 5 3.2, 5 4, 8 5
           C 5 6, 5 6.8, 5 10
           C 5 6.8, 5 6, 2 5
           C 5 4, 5 3.2, 5 0 Z"
        fill={color}
      />
    </svg>
  );
}