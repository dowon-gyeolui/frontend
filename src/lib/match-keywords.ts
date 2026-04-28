import type { MatchCandidate } from "@/components/matching/match-card";

/**
 * Derive 3 personality-style hashtags for the match info modal.
 *
 * Backend's compatibility/report endpoint returns score/element-flavored
 * keywords (e.g. "#금의_기운"); this is the personality-flavored counterpart
 * the matching modal wants ("#책임감", "#순애" — Figma node 37:1175).
 *
 * Sources used: MBTI, score tier, dominant element. Falls back gracefully
 * when fields are missing (free tier blinds dominant_element / mbti).
 */

const MBTI_KEYWORDS: Record<string, [string, string]> = {
  INTJ: ["#계획형", "#논리적"],
  INTP: ["#분석가", "#호기심"],
  ENTJ: ["#리더쉽", "#목표지향"],
  ENTP: ["#아이디어맨", "#순발력"],
  INFJ: ["#통찰력", "#한사람만_봄"],
  INFP: ["#감수성", "#순애"],
  ENFJ: ["#배려쟁이", "#사람중심"],
  ENFP: ["#열정가", "#긍정에너지"],
  ISTJ: ["#책임감", "#성실함"],
  ISFJ: ["#따뜻함", "#섬세함"],
  ESTJ: ["#책임감", "#실행력"],
  ESFJ: ["#친화력", "#배려쟁이"],
  ISTP: ["#쿨함", "#손재주"],
  ISFP: ["#예술적", "#잔잔함"],
  ESTP: ["#모험가", "#순발력"],
  ESFP: ["#분위기메이커", "#솔직함"],
};

const ELEMENT_KEYWORDS: Record<string, string> = {
  목: "#성장형",
  화: "#열정형",
  토: "#안정형",
  금: "#원칙주의",
  수: "#지혜형",
};

function scoreKeyword(score: number): string {
  if (score >= 85) return "#찰떡궁합";
  if (score >= 70) return "#호감궁합";
  if (score >= 50) return "#노력형궁합";
  return "#성장형궁합";
}

export function deriveMatchKeywords(c: MatchCandidate): string[] {
  const out: string[] = [];

  if (c.mbti && MBTI_KEYWORDS[c.mbti]) {
    out.push(...MBTI_KEYWORDS[c.mbti]);
  } else if (c.dominant_element && ELEMENT_KEYWORDS[c.dominant_element]) {
    out.push(ELEMENT_KEYWORDS[c.dominant_element]);
  }

  out.push(scoreKeyword(c.score));

  // Top up to exactly 3 with element fallback if MBTI was missing
  if (out.length < 3 && c.dominant_element && ELEMENT_KEYWORDS[c.dominant_element]) {
    const el = ELEMENT_KEYWORDS[c.dominant_element];
    if (!out.includes(el)) out.push(el);
  }
  while (out.length < 3) out.push("#운명의_상대");

  return out.slice(0, 3);
}

/**
 * Bottom-of-modal tip line. Reuses the existing scoreComment helper feel
 * but is slightly longer and more specific to the saju context.
 */
export function matchModalTip(c: MatchCandidate): string {
  if (c.score >= 90) return "둘이 연애하면 운명적인 인연으로 평생 함께할 수 있어요!";
  if (c.score >= 80) return "둘이 연애하면 장기적으로 금전운이 정말 좋아요!";
  if (c.score >= 70) return "서로의 부족함을 채워주며 안정감 있는 관계가 될 거예요";
  if (c.score >= 60) return "서로 다른 점이 매력으로 느껴지는 새로운 인연이에요";
  return "처음엔 어색해도 차차 마음이 통하는 인연일 수 있어요";
}