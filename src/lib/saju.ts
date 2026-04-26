/**
 * Saju (사주) display helpers — Korean stem/branch labels, hanja glyphs,
 * zodiac animals, and five-element colors.
 *
 * The backend returns Korean stem ("갑") + Korean branch ("자"); these maps
 * provide the supporting display data the UI needs.
 */

export type Element = "wood" | "fire" | "earth" | "metal" | "water";

export type SajuPillar = {
  label: string; // "년주" | "월주" | "일주" | "시주"
  stem: string; // 천간 한글: 갑/을/...
  branch: string; // 지지 한글: 자/축/...
  combined: string; // stem + branch, e.g. "갑자"
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

// 천간 한글 → 한자 + 오행
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

// 지지 한글 → 한자 + 동물 + 오행
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

// 오행 → 한글 + 한자 + 색상
export const ELEMENT_DISPLAY: Record<
  Element,
  { ko: string; hanja: string; en: string; color: string; bgGlow: string }
> = {
  wood: {
    ko: "목",
    hanja: "木",
    en: "WOOD",
    color: "#22c55e",
    bgGlow: "rgba(34, 197, 94, 0.3)",
  },
  fire: {
    ko: "화",
    hanja: "火",
    en: "FIRE",
    color: "#ef4444",
    bgGlow: "rgba(239, 68, 68, 0.3)",
  },
  earth: {
    ko: "토",
    hanja: "土",
    en: "EARTH",
    color: "#eab308",
    bgGlow: "rgba(234, 179, 8, 0.3)",
  },
  metal: {
    ko: "금",
    hanja: "金",
    en: "METAL",
    color: "#cbd5e1",
    bgGlow: "rgba(203, 213, 225, 0.3)",
  },
  water: {
    ko: "수",
    hanja: "水",
    en: "WATER",
    color: "#3b82f6",
    bgGlow: "rgba(59, 130, 246, 0.3)",
  },
};

// Order to render around the pentagon (clockwise from top).
// Top — fire; then earth, metal, water, wood (back to top).
export const ELEMENT_PENTAGON_ORDER: Element[] = [
  "fire",
  "earth",
  "metal",
  "water",
  "wood",
];

/** Compute the dominant element (highest count) for the summary line. */
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