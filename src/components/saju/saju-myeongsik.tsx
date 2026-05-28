"use client";

import { HeartHandshake, Shield, Sparkles, Sun } from "lucide-react";

import {
  BRANCH_DATA,
  ELEMENT_COLOR_KO,
  ELEMENT_DISPLAY,
  STEM_DESCRIPTION,
  STEM_HANJA,
  dominantElement,
  type Element,
  type ElementProfile,
  type SajuPillar,
} from "@/lib/saju";

// 컬럼 헤더 라벨 — 백엔드는 [년주, 월주, 일주, 시주] 순서로 보내지만
// 명식표는 한국 사주에서 통상 시→일→월→년 순서로 좌→우 배열한다.
const PILLAR_HEADER_BY_LABEL: Record<string, string> = {
  시주: "생시",
  일주: "생일",
  월주: "생월",
  년주: "생년",
};

/**
 * 사주 명식(命式) 화면 — Figma-style icon card layout.
 *
 * 두 줄로 구성:
 *   1. 4-기둥 카드 (년주 / 월주 / 일주 / 시주) — 각 카드에 간지,
 *      한자, 색깔+동물 이름. 일주 카드는 보라 그라디언트 강조.
 *   2. 2x2 stat 카드 — 일간(나), 십성, 신살, 궁합 포인트.
 *      각 카드는 색별 아이콘 + 핵심 값 + 한 줄 설명.
 */

// 십성별 한 줄 풀이 (쉬운 한국어)
const TEN_GOD_DESC: Record<string, string> = {
  비견: "자립, 독립심",
  겁재: "도전, 경쟁심",
  식신: "표현, 즐거움",
  상관: "재능, 창의력",
  정재: "안정된 재물",
  편재: "활발한 재물",
  정관: "명예, 직장운",
  편관: "도전, 추진력",
  정인: "공부, 부모운",
  편인: "직관, 독창성",
};

// 12신살 한 줄 풀이
const SPIRIT_DESC: Record<string, string> = {
  겁살: "위기를 넘기는 힘",
  재살: "재물·관재 주의",
  천살: "하늘이 돕는 자리",
  지살: "이동·여행 운",
  도화살: "매력과 인기",
  년살: "매력과 인기",
  월살: "가족 인연",
  망신살: "체면 주의",
  장성살: "지위와 권위",
  반안살: "안정과 안락",
  역마살: "이동과 변화",
  육해살: "건강 주의",
  화개살: "지혜와 학문",
};

const COMPAT_POINT: Record<Element, { title: string; desc: string }> = {
  wood:  { title: "성장의 인연",  desc: "함께 자라나는 사이" },
  fire:  { title: "화합의 인연",  desc: "서로를 빛나게 해줌" },
  earth: { title: "안정의 인연",  desc: "흔들리지 않는 든든함" },
  metal: { title: "결단의 인연",  desc: "신뢰가 깊은 사이" },
  water: { title: "지혜의 인연",  desc: "깊이 이해하는 사이" },
};

/**
 * 사주 명식 카드 묶음 — 명식 표 그리드 + 4-스탯 카드.
 *
 * 표 그리드는 한국 사주명리 표준 명식표 레이아웃(시→일→월→년 순서,
 * 천간 / 십성 / 지지 / 십성 / 지장간 / 12운성 / 12신살 행)을 따른다.
 * 백엔드의 SajuPillar 가 이미 모든 행에 필요한 필드를 채워서 보내주므로
 * 여기선 단순히 표로 매핑만.
 */
export function SajuMyeongsik({
  pillars,
  profile,
}: {
  pillars: SajuPillar[];
  profile: ElementProfile;
}) {
  return (
    <div className="space-y-[14px]">
      <MyeongsikChart pillars={pillars} />
      <StatGrid pillars={pillars} profile={profile} />
    </div>
  );
}

function MyeongsikChart({ pillars }: { pillars: SajuPillar[] }) {
  // 표는 시→일→월→년 순서. 백엔드는 [년,월,일,시] 로 보내므로 reverse.
  const reversed = [...pillars].reverse();
  const dayIndex = reversed.findIndex((p) => p.label === "일주"); // 일주 컬럼 강조

  return (
    <div className="overflow-hidden rounded-[14px] border border-white/15 bg-white/5 backdrop-blur-sm">
      {/* Column header row — 생시 / 생일 / 생월 / 생년 */}
      <div className="grid grid-cols-[44px_1fr_1fr_1fr_1fr] border-b border-white/10 bg-white/5">
        <div />
        {reversed.map((p, i) => (
          <div
            key={p.label}
            className={`py-[8px] text-center text-[11px] font-medium ${
              i === dayIndex ? "text-[#fde047]" : "text-white/55"
            }`}
          >
            {PILLAR_HEADER_BY_LABEL[p.label] ?? p.label}
          </div>
        ))}
      </div>

      <ChartRow label="천간" dayIndex={dayIndex}>
        {reversed.map((p) => (
          <StemCell key={p.label} pillar={p} />
        ))}
      </ChartRow>
      <ChartRow label="십성" dayIndex={dayIndex} muted>
        {reversed.map((p) => (
          <SmallTextCell key={p.label} text={p.stem_ten_god ?? "—"} />
        ))}
      </ChartRow>
      <ChartRow label="지지" dayIndex={dayIndex}>
        {reversed.map((p) => (
          <BranchCell key={p.label} pillar={p} />
        ))}
      </ChartRow>
      <ChartRow label="십성" dayIndex={dayIndex} muted>
        {reversed.map((p) => (
          <SmallTextCell key={p.label} text={p.branch_ten_god ?? "—"} />
        ))}
      </ChartRow>
      <ChartRow label="지장간" dayIndex={dayIndex} muted>
        {reversed.map((p) => (
          <SmallTextCell
            key={p.label}
            text={
              p.hidden_stems && p.hidden_stems.length > 0
                ? p.hidden_stems.join("")
                : "—"
            }
          />
        ))}
      </ChartRow>
      <ChartRow label="12운성" dayIndex={dayIndex} muted>
        {reversed.map((p) => (
          <SmallTextCell key={p.label} text={p.twelve_stage ?? "—"} />
        ))}
      </ChartRow>
      <ChartRow label="12신살" dayIndex={dayIndex} muted last>
        {reversed.map((p) => (
          <SmallTextCell key={p.label} text={p.twelve_spirit ?? "—"} />
        ))}
      </ChartRow>
    </div>
  );
}

function ChartRow({
  label,
  children,
  dayIndex,
  muted = false,
  last = false,
}: {
  label: string;
  children: React.ReactNode[];
  dayIndex: number;
  muted?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[44px_1fr_1fr_1fr_1fr] ${
        last ? "" : "border-b border-white/10"
      }`}
    >
      <div className="grid place-items-center bg-white/5 text-[10px] font-medium text-white/55">
        {label}
      </div>
      {children.map((c, i) => (
        <div
          key={i}
          className={`flex items-center justify-center px-[2px] py-[6px] ${
            i !== children.length - 1 ? "border-r border-white/5" : ""
          } ${i === dayIndex ? "bg-purple-500/10" : ""} ${
            muted ? "text-[12px] text-white/75" : ""
          }`}
        >
          {c}
        </div>
      ))}
    </div>
  );
}

function StemCell({ pillar }: { pillar: SajuPillar }) {
  const stemEl: Element | null =
    pillar.stem_element ?? STEM_HANJA[pillar.stem]?.element ?? null;
  const stemHanja = pillar.stem_hanja ?? STEM_HANJA[pillar.stem]?.hanja ?? "";
  const polarity = pillar.stem_polarity ?? "+";
  const elColor = stemEl ? ELEMENT_DISPLAY[stemEl].color : "#fff";
  const elKo = stemEl ? ELEMENT_DISPLAY[stemEl].ko : "";
  return (
    <div className="flex flex-col items-center gap-[2px] py-[4px]">
      <div className="flex items-baseline gap-[2px]" style={{ color: elColor }}>
        <span className="text-[20px] font-bold leading-none">{pillar.stem}</span>
        <span className="text-[14px] font-bold leading-none opacity-80">
          {stemHanja}
        </span>
      </div>
      {elKo && (
        <span
          className="text-[10px] font-medium"
          style={{ color: elColor }}
        >
          {polarity}
          {elKo}
        </span>
      )}
    </div>
  );
}

function BranchCell({ pillar }: { pillar: SajuPillar }) {
  const branchEl: Element | null =
    pillar.branch_element ?? BRANCH_DATA[pillar.branch]?.element ?? null;
  const branchHanja =
    pillar.branch_hanja ?? BRANCH_DATA[pillar.branch]?.hanja ?? "";
  const polarity = pillar.branch_polarity ?? "+";
  const elColor = branchEl ? ELEMENT_DISPLAY[branchEl].color : "#fff";
  const elKo = branchEl ? ELEMENT_DISPLAY[branchEl].ko : "";
  return (
    <div className="flex flex-col items-center gap-[2px] py-[4px]">
      <div className="flex items-baseline gap-[2px]" style={{ color: elColor }}>
        <span className="text-[20px] font-bold leading-none">{pillar.branch}</span>
        <span className="text-[14px] font-bold leading-none opacity-80">
          {branchHanja}
        </span>
      </div>
      {elKo && (
        <span
          className="text-[10px] font-medium"
          style={{ color: elColor }}
        >
          {polarity}
          {elKo}
        </span>
      )}
    </div>
  );
}

function SmallTextCell({ text }: { text: string }) {
  return <span className="text-[12px] leading-none">{text}</span>;
}

function StatGrid({
  pillars,
  profile,
}: {
  pillars: SajuPillar[];
  profile: ElementProfile;
}) {
  const day = pillars[2];

  // 일간 — 일주의 천간
  const stemEl: Element | null =
    day.stem_element ?? STEM_HANJA[day.stem]?.element ?? null;
  const stemHanja = day.stem_hanja ?? STEM_HANJA[day.stem]?.hanja ?? "?";
  const elHanja = stemEl ? ELEMENT_DISPLAY[stemEl].hanja : "";
  const elColor = stemEl ? ELEMENT_DISPLAY[stemEl].color : "#fde047";
  const stemDesc = STEM_DESCRIPTION[day.stem] ?? "—";
  const dayValue =
    stemEl !== null
      ? `${day.stem}${ELEMENT_DISPLAY[stemEl].ko}(${stemHanja}${elHanja})`
      : day.stem;

  // 십성 — 모든 기둥의 stem/branch ten_god 카운트해서 가장 많은 것
  const counts: Record<string, number> = {};
  for (const p of pillars) {
    if (p.stem_ten_god) counts[p.stem_ten_god] = (counts[p.stem_ten_god] ?? 0) + 1;
    if (p.branch_ten_god)
      counts[p.branch_ten_god] = (counts[p.branch_ten_god] ?? 0) + 1;
  }
  const sortedTenGod = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const topTenGod = sortedTenGod[0]?.[0] ?? "비견";
  const tenGodDesc = TEN_GOD_DESC[topTenGod] ?? "—";

  // 신살 — 일주의 12신살
  const spirit = day.twelve_spirit ?? "—";
  const spiritDesc = SPIRIT_DESC[spirit] ?? "—";

  // 궁합 포인트 — 가장 강한 오행 기준
  const dom = dominantElement(profile);
  const compat = COMPAT_POINT[dom];

  return (
    <div className="grid grid-cols-2 gap-[10px]">
      <StatCard
        title="일간(나)"
        icon={<Sun className="size-[20px] stroke-yellow-300" />}
        value={dayValue}
        valueColor={elColor}
        desc={stemDesc}
      />
      <StatCard
        title="십성"
        icon={<Sparkles className="size-[20px] stroke-purple-300" />}
        value={topTenGod}
        desc={tenGodDesc}
      />
      <StatCard
        title="신살"
        icon={<Shield className="size-[20px] stroke-blue-300" />}
        value={spirit}
        desc={spiritDesc}
      />
      <StatCard
        title="궁합 포인트"
        icon={<HeartHandshake className="size-[20px] stroke-pink-300" />}
        value={compat.title}
        desc={compat.desc}
      />
    </div>
  );
}

function StatCard({
  title,
  icon,
  value,
  desc,
  valueColor,
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
  desc: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-[14px] border border-white/10 bg-white/5 p-[14px] backdrop-blur-sm">
      <div className="flex items-center gap-[6px] text-[12px] font-semibold text-white/85">
        {icon}
        {title}
      </div>
      <p
        className="mt-[8px] text-[18px] font-bold"
        style={{ color: valueColor ?? "#fff" }}
      >
        {value}
      </p>
      <p className="mt-[4px] text-[11px] leading-[16px] text-white/65">{desc}</p>
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
    <h2 className="flex items-baseline gap-[6px] text-[16px] font-bold tracking-tight text-white">
      나의 사주 구성
      <span className="text-[13px] font-medium text-white/55">
        {pillar.combined} ({colorWord} {animal}) · {stemHanja}
        {branchHanja}
      </span>
    </h2>
  );
}