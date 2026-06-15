/**
 * Plain-Korean explanations for saju terms shown as badges/labels in the
 * 인연운 / 사주 풀이 UI. Centralized here so any badge component can pull
 * the same friendly description.
 *
 * Keys are the exact Korean labels the backend emits — keep in sync with
 * fortune.py (badges, relations) and saju_chart.py (ten gods).
 */

export type GlossaryEntry = {
  /** Short headline shown big in the popup. */
  title: string;
  /** 1-2 sentence plain-Korean explanation, suitable for tooltips. */
  body: string;
};

/** 10 ten-gods (십성) — relation between 나 (일간) and another stem. */
export const TEN_GOD_GLOSSARY: Record<string, GlossaryEntry> = {
  비견: {
    title: "비견 — 나와 같은 결",
    body:
      "친구·동료처럼 비슷한 결의 사람을 의미해요. 익숙하고 편한 자리에서 마음이 통하기 쉬운 관계예요.",
  },
  겁재: {
    title: "겁재 — 경쟁심 강한 사이",
    body:
      "활발하고 추진력 있는 동료 같은 인연. 함께하면 자극이 되지만, 너무 부딪히지 않게 거리감도 필요해요.",
  },
  식신: {
    title: "식신 — 표현·즐거움",
    body:
      "여유롭고 즐거운 분위기를 만드는 인연. 말과 표정이 잘 통해서 자연스럽게 호감이 생기는 관계예요.",
  },
  상관: {
    title: "상관 — 재능·재치",
    body:
      "재치 있고 표현력이 뛰어난 사람. 대화가 즐겁지만, 솔직함이 너무 날카로워지지 않게 주의해주세요.",
  },
  정재: {
    title: "정재 — 안정된 이성운",
    body:
      "차분하고 신뢰할 수 있는 이성과의 인연. 차근차근 다가갈 때 안정적인 관계로 발전하기 좋아요.",
  },
  편재: {
    title: "편재 — 활발한 이성운",
    body:
      "활동적이고 사교적인 이성과의 인연. 직감이 끌리는 자리에서 새 인연이 생기기 쉬운 흐름이에요.",
  },
  정관: {
    title: "정관 — 진중한 인연",
    body:
      "진중하고 신뢰감 있는 사람과의 만남. 오랫동안 함께할 인연으로 발전할 가능성이 있는 관계예요.",
  },
  편관: {
    title: "편관 — 강한 첫인상",
    body:
      "카리스마 있고 강단 있는 사람. 첫인상이 강하고 도전적인 만남이 가능성을 열어주는 흐름이에요.",
  },
  정인: {
    title: "정인 — 따뜻한 인연",
    body:
      "따뜻하고 배려 깊은 사람과의 인연. 차분한 자리에서 깊이 있는 관계로 이어지기 좋은 기운이에요.",
  },
  편인: {
    title: "편인 — 독특한 매력",
    body:
      "직관이 예민해지고 평소와 다른 매력이 빛나는 흐름. 끌리는 사람을 한번 믿어봐도 좋아요.",
  },
  "—": {
    title: "특별한 발동 없음",
    body:
      "오늘은 특별한 십성 발동 없이 평이한 흐름이에요. 평소처럼 자연스럽게 임하시면 충분해요.",
  },
};

/**
 * Special-day badges fortune.py emits in `badges[]`. We match by prefix so
 * variants like "삼합 길일" / "육합 길일" both resolve.
 */
export const BADGE_GLOSSARY: Record<string, GlossaryEntry> = {
  "도화 발동": {
    title: "도화살 발동",
    body:
      "‘인기·매력의 별’이 활성화된 날이에요. 평소보다 사람들 시선이 잘 닿고, 호감을 받기 쉬운 흐름입니다.",
  },
  "천을귀인 길일": {
    title: "천을귀인 길일",
    body:
      "사주에서 가장 길한 ‘귀인’ 기운이 닿은 날. 어려운 일도 도와줄 사람을 만나기 쉬운 행운의 날이에요.",
  },
  "삼합 길일": {
    title: "삼합 길일",
    body:
      "내 사주의 일지(태어난 날 아래 글자)와 오늘의 글자가 ‘세 가지 조합’으로 어우러지는 좋은 날이에요. 인연 흐름이 부드럽게 풀리기 쉬워요.",
  },
  "육합 길일": {
    title: "육합 길일",
    body:
      "내 사주의 일지와 오늘 글자가 ‘짝꿍’처럼 짝지어지는 길한 날. 작은 만남이 의미 있는 관계로 이어지기 쉬운 흐름이에요.",
  },
  "육충 주의": {
    title: "육충 주의",
    body:
      "내 사주의 일지와 오늘 글자가 부딪히는 날. 직설적인 표현보다 부드러운 말투가 좋아요.",
  },
};

/**
 * 60 갑자 일주(日柱) — too many to list, so we describe by stem element instead.
 * Backend's TodayFortuneResponse.element_today already gives 한글 오행 name
 * ("목"/"화"/"토"/"금"/"수"). Show element-level explanation when the user
 * taps the today-pillar badge.
 */
export const ELEMENT_GLOSSARY: Record<string, GlossaryEntry> = {
  목: {
    title: "오늘의 기운 — 나무",
    body:
      "나무처럼 위로 뻗는 성장·시작의 에너지. 새로운 시도와 만남에 어울리는 활기찬 하루입니다.",
  },
  화: {
    title: "오늘의 기운 — 불",
    body:
      "불처럼 밝게 빛나는 표현·열정의 에너지. 사람을 끌어당기고 분위기를 띄우기 좋은 날이에요.",
  },
  토: {
    title: "오늘의 기운 — 흙",
    body:
      "땅처럼 든든하고 안정된 기운. 차분하게 마음을 나누거나 깊은 대화를 나누기 좋은 하루예요.",
  },
  금: {
    title: "오늘의 기운 — 금",
    body:
      "쇠처럼 단단하고 정돈된 기운. 깔끔한 첫인상이 통하고 신뢰감 있는 만남에 유리한 날이에요.",
  },
  수: {
    title: "오늘의 기운 — 물",
    body:
      "물처럼 깊고 잔잔한 지혜의 기운. 차분하고 깊이 있는 대화가 빛나는 하루입니다.",
  },
};

export const TODAY_PILLAR_GLOSSARY: GlossaryEntry = {
  title: "오늘 일주란?",
  body:
    "그날을 상징하는 두 글자 조합이에요. 이 글자가 내 사주와 만나면서 그날의 인연 흐름이 결정돼요.",
};

/** Lookup helper — falls back to a generic info card if term is unknown. */
export function lookupTerm(term: string): GlossaryEntry | null {
  if (term in TEN_GOD_GLOSSARY) return TEN_GOD_GLOSSARY[term];
  if (term in BADGE_GLOSSARY) return BADGE_GLOSSARY[term];
  return null;
}