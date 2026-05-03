"use client";

/**
 * ZAMI 공식 얼굴 인증 뱃지 — 사진이 strict face check (얼굴 면적
 * 25%+ 단일 인물) 를 통과한 경우에만 노출.
 *
 * 디자인: 진보라 원형 배경 + 노란 4-point sparkle (브랜드 마크).
 * 매칭 카드 / 프로필 상세 / 갤러리 사진 우상단에 overlay.
 *
 * 크기 프리셋:
 *   sm — 매칭 카드 사진 (작게)
 *   md — 프로필 상세 hero 사진
 *   lg — 향후 큰 노출 위치
 */
type Size = "sm" | "md" | "lg";

const SIZE_PX: Record<Size, number> = {
  sm: 22,
  md: 28,
  lg: 36,
};

const ACCENT = "#fde047"; // 브랜드 yellow (zami-logo 와 동일)
const BG = "#1f1235";     // 진보라 (배경/카드 톤과 통일)

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
  // 4-point sparkle — zami-logo 의 BigSparkle 과 동일한 path 비율.
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