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

/**
 * 사주 명식(命式) 화면 — Figma-style icon card layout.
 *
 * 두 줄로 구성:
 *   1. 4-기둥 카드 (년주 / 월주 / 일주 / 시주) — 각 카드에 띠 동물 이모지,
 *      간지, 한자, 색깔+동물 이름. 일주 카드는 보라 그라디언트 강조.
 *   2. 2x2 stat 카드 — 일간(나), 십성, 신살, 궁합 포인트.
 *      각 카드는 색별 아이콘 + 핵심 값 + 한 줄 설명.
 */

const ZODIAC_EMOJI: Record<string, string> = {
  자: "🐭", 축: "🐮", 인: "🐯", 묘: "🐰", 진: "🐉", 사: "🐍",
  오: "🐴", 미: "🐏", 신: "🐵", 유: "🐓", 술: "🐶", 해: "🐷",
};

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
 * 사주 명식 카드 묶음 — 4-기둥 + 4-스탯.
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
      <PillarRow pillars={pillars} />
      <StatGrid pillars={pillars} profile={profile} />
    </div>
  );
}

function PillarRow({ pillars }: { pillars: SajuPillar[] }) {
  return (
    <div className="grid grid-cols-4 gap-[8px]">
      {pillars.map((p, i) => (
        <PillarIconCard key={p.label} pillar={p} isDay={i === 2} />
      ))}
    </div>
  );
}

function PillarIconCard({
  pillar,
  isDay,
}: {
  pillar: SajuPillar;
  isDay: boolean;
}) {
  const stemEl: Element | null =
    pillar.stem_element ?? STEM_HANJA[pillar.stem]?.element ?? null;
  const branchInfo = BRANCH_DATA[pillar.branch];
  const animal = pillar.branch_animal ?? branchInfo?.animal ?? "?";
  const colorWord = stemEl ? ELEMENT_COLOR_KO[stemEl] : "";
  const stemHanja = pillar.stem_hanja ?? STEM_HANJA[pillar.stem]?.hanja ?? "";
  const branchHanja = pillar.branch_hanja ?? branchInfo?.hanja ?? "";
  const emoji = ZODIAC_EMOJI[pillar.branch] ?? "·";

  return (
    <div
      className={`relative flex flex-col items-center gap-[4px] rounded-[14px] p-[8px] backdrop-blur-sm ${
        isDay
          ? "border-[1.5px] border-purple-400/60 bg-gradient-to-b from-purple-500/30 to-purple-600/15 shadow-[0_0_20px_-4px_rgba(168,85,247,0.55)]"
          : "border border-white/10 bg-white/5"
      }`}
    >
      <p className="text-[10px] font-medium text-white/55">{pillar.label}</p>
      <div className="text-[28px] leading-none">{emoji}</div>
      <p className="text-[12px] font-bold text-white">
        {pillar.combined}
        {stemHanja && (
          <span className="ml-[2px] text-[10px] font-medium text-white/55">
            ({stemHanja}
            {branchHanja})
          </span>
        )}
      </p>
      <p className="text-[10px] text-white/65">
        {colorWord} {animal}
      </p>
    </div>
  );
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