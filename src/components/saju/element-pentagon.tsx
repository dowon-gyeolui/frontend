"use client";

import {
  ELEMENT_DISPLAY,
  ELEMENT_PENTAGON_ORDER,
  type ElementProfile,
} from "@/lib/saju";

/**
 * 5-axis radar (pentagon) chart of the user's five-element distribution.
 *
 * Each axis is one of fire / earth / metal / water / wood. Counts are
 * normalised to a 0..maxAxis fraction so a single dominant element doesn't
 * collapse the others to invisible.
 */
type Props = {
  profile: ElementProfile;
  size?: number; // outer SVG size in px
};

const RING_LEVELS = 4; // concentric guides

export function ElementPentagon({ profile, size = 280 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  // Reserve room for axis labels around the pentagon.
  const radius = size / 2 - 32;

  // Per-axis raw count, then a normaliser so the largest axis fills the chart.
  const counts: Record<string, number> = {
    fire: profile.fire,
    earth: profile.earth,
    metal: profile.metal,
    water: profile.water,
    wood: profile.wood,
  };
  const maxCount = Math.max(1, ...Object.values(counts));

  const axes = ELEMENT_PENTAGON_ORDER.map((el, i) => {
    // Start at top (-90deg) and go clockwise.
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

  // Concentric guide pentagons.
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
        {/* Concentric guide rings */}
        {ringPolygons.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="rgba(168, 85, 247, 0.15)"
            strokeWidth={1}
          />
        ))}

        {/* Axes from center to each label */}
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

        {/* Filled data polygon */}
        <polygon
          points={dataPolygon}
          fill="rgba(168, 85, 247, 0.25)"
          stroke="#a855f7"
          strokeWidth={2}
        />

        {/* Data point glow + dot per axis */}
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

      {/* Axis labels (HTML, positioned absolutely so they wrap freely) */}
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
            {/* Score badge */}
            <span
              className="text-[12px] font-semibold leading-none"
              style={{ color: display.color }}
            >
              {counts[element]}
            </span>
            {/* Element token */}
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
            <span
              className="mt-1 text-[9px] font-bold leading-none"
              style={{ color: display.color }}
            >
              {display.en}
            </span>
          </div>
        );
      })}
    </div>
  );
}