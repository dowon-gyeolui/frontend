"use client";
// 역할 설명: 사용자의 오행 분포를 5축 레이더(오각형) 차트로 시각화

import {
  ELEMENT_DISPLAY,
  ELEMENT_PENTAGON_ORDER,
  type ElementProfile,
} from "@/lib/saju";

type Props = {
  profile: ElementProfile;
  size?: number;
};

const RING_LEVELS = 4;

export function ElementPentagon({ profile, size = 280 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 32;

  const counts: Record<string, number> = {
    fire: profile.fire,
    earth: profile.earth,
    metal: profile.metal,
    water: profile.water,
    wood: profile.wood,
  };
  const maxCount = Math.max(1, ...Object.values(counts));

  const axes = ELEMENT_PENTAGON_ORDER.map((el, i) => {
    const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / 5;
    return { element: el, angle };
  });

  const axisPoint = (angle: number, fraction: number) => ({
    x: cx + radius * fraction * Math.cos(angle),
    y: cy + radius * fraction * Math.sin(angle),
  });

  const dataPoints = axes.map(({ element, angle }) => {
    const fraction = counts[element] / maxCount;
    return { ...axisPoint(angle, fraction), element, count: counts[element] };
  });

  const dataPolygon = dataPoints
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  const ringPolygons = Array.from({ length: RING_LEVELS }, (_, r) => {
    const fraction = (r + 1) / RING_LEVELS;
    return axes
      .map(({ angle }) => {
        const p = axisPoint(angle, fraction);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(" ");
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {ringPolygons.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="rgba(168, 85, 247, 0.15)"
            strokeWidth={1}
          />
        ))}

        {axes.map(({ angle }, i) => {
          const end = axisPoint(angle, 1);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke="rgba(168, 85, 247, 0.25)"
              strokeWidth={1}
            />
          );
        })}

        <polygon
          points={dataPolygon}
          fill="rgba(168, 85, 247, 0.25)"
          stroke="#a855f7"
          strokeWidth={2}
        />

        {dataPoints.map((p, i) => {
          const display = ELEMENT_DISPLAY[p.element];
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={6} fill={display.bgGlow} />
              <circle cx={p.x} cy={p.y} r={3.5} fill={display.color} />
            </g>
          );
        })}
      </svg>

      {axes.map(({ element, angle }, i) => {
        const labelRadius = radius + 18;
        const x = cx + labelRadius * Math.cos(angle);
        const y = cy + labelRadius * Math.sin(angle);
        const display = ELEMENT_DISPLAY[element];
        return (
          <div
            key={i}
            className="pointer-events-none absolute flex flex-col items-center"
            style={{
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
            }}
          >
            <span
              className="text-[12px] font-semibold leading-none"
              style={{ color: display.color }}
            >
              {counts[element]}
            </span>
            <div
              className="mt-1 grid size-[34px] place-items-center rounded-full border-2 text-[12px] font-bold leading-none"
              style={{
                borderColor: display.color,
                color: display.color,
                background: `radial-gradient(circle, ${display.bgGlow} 0%, transparent 70%)`,
              }}
            >
              {display.ko}
            </div>
          </div>
        );
      })}
    </div>
  );
}