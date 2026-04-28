"use client";

import {
  BRANCH_DATA,
  ELEMENT_COLOR_KO,
  ELEMENT_DISPLAY,
  STEM_HANJA,
  type Element,
  type SajuPillar,
} from "@/lib/saju";

/**
 * 명식(命式) chart — traditional saju table.
 *
 * Renders the four pillars as columns (생시 / 생일 / 생월 / 생년 from left
 * to right, just like the reference design) with rows for 천간, 십성,
 * 지지, 십성, 지장간, 12운성, and 12신살.
 *
 * Color is derived per cell from the element of the stem/branch — the
 * little "+목" / "-금" tags echo the pill cells' polarity.
 */
export function SajuMyeongsik({ pillars }: { pillars: SajuPillar[] }) {
  // Column order: 생시 (시주) → 생일 (일주) → 생월 (월주) → 생년 (년주)
  const cols: { col: string; pillar: SajuPillar }[] = [
    { col: "생시", pillar: pillars[3] },
    { col: "생일", pillar: pillars[2] },
    { col: "생월", pillar: pillars[1] },
    { col: "생년", pillar: pillars[0] },
  ];

  return (
    <div className="rounded-[14px] border border-white/15 bg-white/95 p-[12px] text-[#1b1029]">
      {/* Column headers */}
      <div className="grid grid-cols-[60px_repeat(4,1fr)] text-center text-[12px] font-medium text-[#6b6580]">
        <div />
        {cols.map((c) => (
          <div key={c.col} className="py-[4px]">{c.col}</div>
        ))}
      </div>

      {/* 천간 row */}
      <Row label="천간">
        {cols.map((c) => (
          <BigCell
            key={c.col + "stem"}
            ko={c.pillar.stem}
            hanja={c.pillar.stem_hanja ?? STEM_HANJA[c.pillar.stem]?.hanja ?? ""}
            element={c.pillar.stem_element ?? null}
            polarity={c.pillar.stem_polarity ?? null}
          />
        ))}
      </Row>

      {/* 십성 (stems) */}
      <Row label="십성">
        {cols.map((c) => (
          <SmallCell
            key={c.col + "tg-stem"}
            // 일주의 일간 자체는 비견(자기) — 표시 생략
            text={c.pillar.label === "일주" ? "—" : c.pillar.stem_ten_god ?? "—"}
            element={c.pillar.stem_element ?? null}
          />
        ))}
      </Row>

      {/* 지지 row */}
      <Row label="지지">
        {cols.map((c) => (
          <BigCell
            key={c.col + "branch"}
            ko={c.pillar.branch}
            hanja={c.pillar.branch_hanja ?? BRANCH_DATA[c.pillar.branch]?.hanja ?? ""}
            element={c.pillar.branch_element ?? null}
            polarity={c.pillar.branch_polarity ?? null}
          />
        ))}
      </Row>

      {/* 십성 (branches) */}
      <Row label="십성">
        {cols.map((c) => (
          <SmallCell
            key={c.col + "tg-branch"}
            text={c.pillar.branch_ten_god ?? "—"}
            element={c.pillar.branch_element ?? null}
          />
        ))}
      </Row>

      {/* 지장간 */}
      <Row label="지장간">
        {cols.map((c) => (
          <SmallCell
            key={c.col + "hidden"}
            text={(c.pillar.hidden_stems ?? []).join("") || "—"}
          />
        ))}
      </Row>

      {/* 12운성 */}
      <Row label="12운성">
        {cols.map((c) => (
          <SmallCell key={c.col + "stage"} text={c.pillar.twelve_stage ?? "—"} />
        ))}
      </Row>

      {/* 12신살 */}
      <Row label="12신살" last>
        {cols.map((c) => (
          <SmallCell key={c.col + "spirit"} text={c.pillar.twelve_spirit ?? "—"} />
        ))}
      </Row>
    </div>
  );
}

function Row({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[60px_repeat(4,1fr)] ${
        last ? "" : "border-b border-[#e5e0ee]"
      }`}
    >
      <div className="grid place-items-center py-[10px] text-[13px] font-medium text-[#6b6580]">
        {label}
      </div>
      {children}
    </div>
  );
}

function BigCell({
  ko,
  hanja,
  element,
  polarity,
}: {
  ko: string;
  hanja: string;
  element: Element | null;
  polarity: "+" | "-" | null;
}) {
  const color = element ? ELEMENT_DISPLAY[element].color : "#1b1029";
  const elementKo = element ? ELEMENT_DISPLAY[element].ko : "";
  return (
    <div className="relative grid place-items-center py-[12px]">
      <div className="flex items-baseline gap-[2px] font-bold leading-none" style={{ color }}>
        <span className="text-[26px]">{ko}</span>
        <span className="text-[20px] opacity-90">{hanja}</span>
      </div>
      {polarity && elementKo && (
        <span
          className="mt-[4px] text-[11px] font-semibold"
          style={{ color }}
        >
          {polarity}
          {elementKo}
        </span>
      )}
    </div>
  );
}

function SmallCell({
  text,
  element,
}: {
  text: string;
  element?: Element | null;
}) {
  const color = element ? ELEMENT_DISPLAY[element].color : "#1b1029";
  return (
    <div className="grid place-items-center py-[8px] text-[13px] font-medium" style={{ color }}>
      {text}
    </div>
  );
}

/**
 * Day-pillar headline — shows e.g. "갑술(푸른 개)" with the day stem's
 * element color word + branch animal. Mirrors the screenshot's title.
 */
export function DayPillarHeadline({ pillar }: { pillar: SajuPillar }) {
  const stemEl: Element | null =
    pillar.stem_element ?? STEM_HANJA[pillar.stem]?.element ?? null;
  const animal = pillar.branch_animal ?? BRANCH_DATA[pillar.branch]?.animal ?? "";
  const colorWord = stemEl ? ELEMENT_COLOR_KO[stemEl] : "";
  const stemHanja = pillar.stem_hanja ?? STEM_HANJA[pillar.stem]?.hanja ?? "";
  const branchHanja = pillar.branch_hanja ?? BRANCH_DATA[pillar.branch]?.hanja ?? "";
  return (
    <div className="text-[18px] font-bold tracking-tight text-white">
      {pillar.combined} ({colorWord} {animal})
      <span className="ml-[6px] text-[13px] font-medium text-white/55">
        {stemHanja}
        {branchHanja}
      </span>
    </div>
  );
}