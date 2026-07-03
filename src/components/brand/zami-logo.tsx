"use client";
// ZAMI 워드마크 로고 컴포넌트 — 텍스트 + sparkle 아이콘을 인라인 SVG로 렌더링한다.

type Size = "sm" | "md" | "lg";

type Preset = {
  textPx: number;
  trackingEm: number;
  sparkleHeightPx: number;
  sparkleLeftPct: number;
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

const ACCENT = "#fde047";

export function ZamiLogo({
  size = "sm",
  color = "#ffffff",
  accentColor = ACCENT,
  className = "",
}: {
  size?: Size;
  color?: string;
  accentColor?: string;
  className?: string;
}) {
  const preset = SIZE_PRESETS[size];
  const sparkleWidth = preset.sparkleHeightPx * (16 / 31);

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