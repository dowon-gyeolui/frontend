"use client";
// 역할 설명: 사주 페이지 하단에 표시되는 접이식 용어 설명(글로서리) 섹션

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

type Entry = {
  term: string;
  short: string;
  detail: string;
};

const PILLAR_TERMS: Entry[] = [
  {
    term: "년주",
    short: "태어난 해의 기운",
    detail:
      "어린 시절 그리고 삶의 큰 배경을 상징하는 글자입니다.",
  },
  {
    term: "월주",
    short: "태어난 달의 기운",
    detail:
      "청년기 그리고 사회 활동을 상징합니다.",
  },
  {
    term: "일주",
    short: "태어난 날의 기운",
    detail:
      "사주의 가장 중요한 기둥. 본인 자체를 나타내며, 나를 상징하는 글자입니다.",
  },
  {
    term: "시주",
    short: "태어난 시각의 기운",
    detail:
      "자식과 말년 그리고 내면을 상징합니다. 출생 시간 모름이면 미상으로 표시됩니다.",
  },
];

const ANALYSIS_TERMS: Entry[] = [
  {
    term: "일간",
    short: "본인을 상징하는 한 글자",
    detail:
      "사주 풀이가 이 글자를 중심으로 진행됩니다.",
  },
  {
    term: "강한 오행",
    short: "8자 중 가장 많은 기운",
    detail:
      "이 기운이 자신의 강점·기본 성향이 됩니다.",
  },
  {
    term: "약한 오행",
    short: "보완이 필요한 기운",
    detail:
      "이 영역의 능력·성향이 부족하기 쉬워, 보완한다면 균형이 잡힙니다.",
  },
  {
    term: "추천 색",
    short: "약한 오행을 채워주는 색",
    detail:
      "오행마다 대응하는 색이 있습니다. 약한 오행의 색을 가까이 두면 부족한 기운을 보완할 수 있습니다.",
  },
];

const ELEMENT_TERMS: Entry[] = [
  {
    term: "오행",
    short: "우주의 기운",
    detail:
      "나무 불 흙 금 물 다섯 기운. 서로가 균형을 이룹니다.",
  },
  {
    term: "천간",
    short: "하늘의 기운",
    detail:
      "갑·을·병·정·무·기·경·신·임·계 10개.",
  },
  {
    term: "지지",
    short: "땅의 기운",
    detail:
      "12간지",
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
          사주 용어 한눈에 보기
        </span>
        {open ? (
          <ChevronUp className="size-[16px] stroke-white/60" />
        ) : (
          <ChevronDown className="size-[16px] stroke-white/60" />
        )}
      </button>
      {open && (
        <div className="space-y-[16px] border-t border-white/10 px-[14px] py-[14px]">
          <Group title="사주" entries={PILLAR_TERMS} />
          <Group title="분석 카드" entries={ANALYSIS_TERMS} />
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