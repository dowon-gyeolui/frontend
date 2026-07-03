"use client";
// ZAMI 얼굴 인증 뱃지 컴포넌트 — 인증된 사진 위에 겹쳐 노출하는 sparkle 배지.

type Size = "sm" | "md" | "lg";

const SIZE_PX: Record<Size, number> = {
  sm: 22,
  md: 28,
  lg: 36,
};

const ACCENT = "#fde047";
const BG = "#1f1235";

export function ZamiVerifiedBadge({
  size = "sm",
  className = "",
  title = "ZAMI 인증 — 검증된 얼굴 사진",
}: {
  size?: Size;
  className?: string;
  title?: string;
}) {
  const px = SIZE_PX[size];
  const sparklePx = Math.round(px * 0.55);
  return (
    <span
      role="img"
      aria-label={title}
      title={title}
      className={`inline-grid place-items-center rounded-full border border-[#fde047]/60 shadow-[0_0_8px_-2px_rgba(253,224,71,0.65)] ${className}`}
      style={{
        width: px,
        height: px,
        backgroundColor: BG,
      }}
    >
      <Sparkle px={sparklePx} color={ACCENT} />
    </span>
  );
}

function Sparkle({ px, color }: { px: number; color: string }) {
  const w = px;
  const h = Math.round(px * (23 / 14));
  return (
    <svg
      viewBox="0 0 14 23"
      width={w}
      height={h}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
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