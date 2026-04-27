"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

/**
 * Plain-Korean glossary the saju page renders at the bottom. Collapsed by
 * default — the user opens it on demand. Each entry pairs a "term card"
 * with a friendly definition so the screen above (which uses the actual
 * terminology) stays readable.
 */
type Entry = {
  term: string;
  short: string;
  detail: string;
};

const PILLAR_TERMS: Entry[] = [
  {
    term: "년주(年柱)",
    short: "태어난 해의 기운",
    detail:
      "조상·어린 시절·삶의 큰 배경을 상징하는 글자. 천간(위) + 지지(아래) 두 글자로 구성됩니다.",
  },
  {
    term: "월주(月柱)",
    short: "태어난 달의 기운",
    detail:
      "부모·청년기·사회 활동을 상징. 24절기 중 어느 절기에 태어났는지로 결정됩니다.",
  },
  {
    term: "일주(日柱)",
    short: "태어난 날의 기운 — 사주의 핵심",
    detail:
      "사주의 가장 중요한 기둥. 본인 자체를 나타내며, 위 글자(일간)가 곧 ‘나’를 상징하는 글자입니다.",
  },
  {
    term: "시주(時柱)",
    short: "태어난 시각의 기운",
    detail:
      "자식·말년·내면을 상징. 출생 시간 모름이면 ‘미상’으로 표시되고 분석에서 제외됩니다.",
  },
];

const ANALYSIS_TERMS: Entry[] = [
  {
    term: "일간(나)",
    short: "본인을 상징하는 한 글자",
    detail:
      "일주의 위 글자(천간). 10개 천간 중 하나로, 사주 풀이 전체가 이 글자를 중심으로 진행됩니다. 예: 甲木(갑목) = 큰 나무 같은 곧고 강한 본성.",
  },
  {
    term: "강한 오행",
    short: "8자 중 가장 많은 기운",
    detail:
      "사주 8자(천간 4 + 지지 4)에 가장 많이 등장하는 오행. 이 기운이 자신의 강점·기본 성향이 됩니다.",
  },
  {
    term: "약한 오행",
    short: "보완이 필요한 기운",
    detail:
      "8자에 적게 등장하는 오행. 이 영역의 능력·성향이 부족하기 쉬워, 의도적으로 보완하면 균형이 잡힙니다.",
  },
  {
    term: "추천 색",
    short: "약한 오행을 채워주는 색",
    detail:
      "오행마다 대응하는 색이 있습니다. 약한 오행의 색을 의상·소품으로 가까이 두면 부족한 기운을 보완할 수 있습니다.",
  },
];

const ELEMENT_TERMS: Entry[] = [
  {
    term: "오행(五行)",
    short: "다섯 가지 우주 기운",
    detail:
      "목(木)·화(火)·토(土)·금(金)·수(水) 다섯 기운. 서로 생(生)하기도 하고 극(剋)하기도 하면서 균형을 이룹니다.",
  },
  {
    term: "천간(天干)",
    short: "사주 위쪽 글자 — 하늘의 기운",
    detail:
      "갑·을·병·정·무·기·경·신·임·계 10개. 사주 4기둥의 윗글자가 천간입니다.",
  },
  {
    term: "지지(地支)",
    short: "사주 아래쪽 글자 — 땅의 기운, 십이지 동물",
    detail:
      "자(쥐)·축(소)·인(범)·묘(토끼)·진(용)·사(뱀)·오(말)·미(양)·신(원숭이)·유(닭)·술(개)·해(돼지) 12개. 사주 4기둥의 아랫글자가 지지입니다.",
  },
];

export function SajuGlossary() {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-[14px] border border-white/10 bg-white/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-[14px] py-[12px] text-left"
      >
        <span className="text-[14px] font-bold text-white">
          📖 사주 용어 한눈에 보기
        </span>
        {open ? (
          <ChevronUp className="size-[16px] stroke-white/60" />
        ) : (
          <ChevronDown className="size-[16px] stroke-white/60" />
        )}
      </button>
      {open && (
        <div className="space-y-[16px] border-t border-white/10 px-[14px] py-[14px]">
          <Group title="사주 4기둥" entries={PILLAR_TERMS} />
          <Group title="화면의 분석 카드" entries={ANALYSIS_TERMS} />
          <Group title="기본 개념" entries={ELEMENT_TERMS} />
        </div>
      )}
    </section>
  );
}

function Group({ title, entries }: { title: string; entries: Entry[] }) {
  return (
    <div>
      <p className="text-[12px] font-semibold text-purple-300">{title}</p>
      <ul className="mt-[8px] space-y-[10px]">
        {entries.map((e) => (
          <li key={e.term}>
            <p className="text-[13px] font-bold text-white">
              {e.term}{" "}
              <span className="font-normal text-white/60">— {e.short}</span>
            </p>
            <p className="mt-[2px] text-[12px] leading-[18px] text-white/65">
              {e.detail}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}