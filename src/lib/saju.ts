// 사주 표시용 헬퍼 — 천간/지지 한글·한자·동물·오행 데이터와 색상 매핑.
export type Element = "wood" | "fire" | "earth" | "metal" | "water";

export type SajuPillar = {
  label: string;
  stem: string;
  branch: string;
  combined: string;

  stem_hanja?: string | null;
  stem_element?: Element | null;
  stem_polarity?: "+" | "-" | null;
  stem_ten_god?: string | null;
  branch_hanja?: string | null;
  branch_animal?: string | null;
  branch_element?: Element | null;
  branch_polarity?: "+" | "-" | null;
  branch_ten_god?: string | null;
  hidden_stems?: string[];
  twelve_stage?: string | null;
  twelve_spirit?: string | null;
};

export type ElementProfile = {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
};

export type SajuResponse = {
  user_id: number;
  input_summary: {
    birth_date: string;
    birth_time: string | null;
    calendar_type: "solar" | "lunar";
    is_leap_month: boolean;
    gender: string | null;
  };
  pillars: SajuPillar[];
  element_profile: ElementProfile;
  summary: string;
  interpretation_status: "pending" | "ready";
  interpretation_sources: string[];
  interpretation: string | null;
};

export const STEM_HANJA: Record<string, { hanja: string; element: Element }> = {
  갑: { hanja: "甲", element: "wood" },
  을: { hanja: "乙", element: "wood" },
  병: { hanja: "丙", element: "fire" },
  정: { hanja: "丁", element: "fire" },
  무: { hanja: "戊", element: "earth" },
  기: { hanja: "己", element: "earth" },
  경: { hanja: "庚", element: "metal" },
  신: { hanja: "辛", element: "metal" },
  임: { hanja: "壬", element: "water" },
  계: { hanja: "癸", element: "water" },
};

export const BRANCH_DATA: Record<
  string,
  { hanja: string; animal: string; element: Element }
> = {
  자: { hanja: "子", animal: "쥐", element: "water" },
  축: { hanja: "丑", animal: "소", element: "earth" },
  인: { hanja: "寅", animal: "범", element: "wood" },
  묘: { hanja: "卯", animal: "토끼", element: "wood" },
  진: { hanja: "辰", animal: "용", element: "earth" },
  사: { hanja: "巳", animal: "뱀", element: "fire" },
  오: { hanja: "午", animal: "말", element: "fire" },
  미: { hanja: "未", animal: "양", element: "earth" },
  신: { hanja: "申", animal: "원숭이", element: "metal" },
  유: { hanja: "酉", animal: "닭", element: "metal" },
  술: { hanja: "戌", animal: "개", element: "earth" },
  해: { hanja: "亥", animal: "돼지", element: "water" },
};

export const ELEMENT_DISPLAY: Record<
  Element,
  { ko: string; hanja: string; en: string; color: string; bgGlow: string }
> = {
  wood: {
    ko: "나무",
    hanja: "木",
    en: "WOOD",
    color: "#22c55e",
    bgGlow: "rgba(34, 197, 94, 0.3)",
  },
  fire: {
    ko: "불",
    hanja: "火",
    en: "FIRE",
    color: "#ef4444",
    bgGlow: "rgba(239, 68, 68, 0.3)",
  },
  earth: {
    ko: "흙",
    hanja: "土",
    en: "EARTH",
    color: "#9a6a3a",
    bgGlow: "rgba(154, 106, 58, 0.35)",
  },
  metal: {
    ko: "금",
    hanja: "金",
    en: "METAL",
    color: "#d4af37",
    bgGlow: "rgba(212, 175, 55, 0.35)",
  },
  water: {
    ko: "물",
    hanja: "水",
    en: "WATER",
    color: "#3b82f6",
    bgGlow: "rgba(59, 130, 246, 0.3)",
  },
};

export const ELEMENT_PENTAGON_ORDER: Element[] = [
  "fire",
  "earth",
  "metal",
  "water",
  "wood",
];

export function dominantElement(profile: ElementProfile): Element {
  const entries: [Element, number][] = [
    ["wood", profile.wood],
    ["fire", profile.fire],
    ["earth", profile.earth],
    ["metal", profile.metal],
    ["water", profile.water],
  ];
  return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
}

export const STEM_DESCRIPTION: Record<string, string> = {
  갑: "큰 나무, 푸른 숲",
  을: "여린 풀, 새싹",
  병: "태양의 불",
  정: "등불, 작은 빛",
  무: "거대한 산",
  기: "비옥한 들판",
  경: "강철, 도끼",
  신: "보석, 칼날",
  임: "큰 강, 바다",
  계: "빗물, 이슬",
};

export const ELEMENT_COLOR_KO: Record<Element, string> = {
  wood: "푸른",
  fire: "붉은",
  earth: "노란",
  metal: "흰",
  water: "검은",
};