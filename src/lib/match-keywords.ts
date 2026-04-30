import type { MatchCandidate } from "@/components/matching/match-card";

/**
 * Per-user keyword + tagline derivation.
 *
 * Earlier versions read like every match looked the same — only 5 score
 * tiers and one keyword per MBTI meant most users saw nearly identical
 * chips and identical tagline. This module fixes that by:
 *
 *   1. Larger pools per MBTI / element so we have material to pick from.
 *   2. A deterministic per-user seed (user_id + small salts) that picks
 *      one item from the pool — same user always sees the same chip
 *      across page navigations, but different users see different ones.
 *   3. Tagline templates that splice in the user's element + MBTI traits
 *      so phrasing varies in 50+ ways instead of 5.
 */

const MBTI_KEYWORDS: Record<string, readonly string[]> = {
  INTJ: ["#계획형", "#논리적", "#전략가", "#장기시야", "#독립적"],
  INTP: ["#분석가", "#호기심많음", "#아이디어뱅크", "#유연사고", "#마이페이스"],
  ENTJ: ["#리더쉽", "#목표지향", "#추진형", "#결단력", "#카리스마"],
  ENTP: ["#아이디어맨", "#순발력", "#토론러", "#호기심왕", "#재치만점"],
  INFJ: ["#통찰력", "#한사람만_봄", "#깊은공감", "#배려쟁이", "#속깊음"],
  INFP: ["#감수성풍부", "#순애보", "#이상주의", "#섬세함", "#내면충실"],
  ENFJ: ["#배려쟁이", "#사람중심", "#따뜻한리더", "#공감의달인", "#긍정파워"],
  ENFP: ["#열정가", "#긍정에너지", "#분위기메이커", "#호기심왕", "#열린마음"],
  ISTJ: ["#책임감", "#성실함", "#약속지킴", "#원칙주의", "#차분함"],
  ISFJ: ["#따뜻함", "#섬세함", "#헌신적", "#안정추구", "#조용한매력"],
  ESTJ: ["#실행력", "#리더쉽", "#책임감", "#효율러", "#솔직함"],
  ESFJ: ["#친화력", "#배려쟁이", "#센스만점", "#사교적", "#정감있음"],
  ISTP: ["#쿨함", "#손재주", "#실용주의", "#관찰력", "#마이페이스"],
  ISFP: ["#예술적", "#잔잔함", "#감각적", "#자연체", "#조용한매력"],
  ESTP: ["#모험가", "#순발력", "#솔직대담", "#액티브", "#현실감각"],
  ESFP: ["#분위기메이커", "#솔직함", "#매력만점", "#사교왕", "#긍정에너지"],
};

const ELEMENT_KEYWORDS: Record<string, readonly string[]> = {
  목: ["#성장형", "#봄의기운", "#가능성"],
  화: ["#열정형", "#밝은기운", "#솔직함"],
  토: ["#안정형", "#든든함", "#포용력"],
  금: ["#원칙주의", "#단단함", "#책임감"],
  수: ["#지혜형", "#잔잔함", "#속깊음"],
};

const SCORE_KEYWORDS = [
  // 50 미만
  ["#노력형궁합", "#성장커플", "#배움이있는"],
  // 50-69
  ["#안정형궁합", "#잔잔한인연", "#편안함"],
  // 70-84
  ["#호감궁합", "#케미좋음", "#합이좋음"],
  // 85+
  ["#찰떡궁합", "#운명의_상대", "#천생연분"],
] as const;

/** Tiny deterministic 32-bit hash from a numeric id + salt. */
function seedFrom(id: number, salt: number): number {
  let x = (id | 0) * 2654435761 + (salt | 0) * 16807;
  x = (x ^ (x >>> 16)) >>> 0;
  x = (x * 0x85ebca6b) >>> 0;
  x = (x ^ (x >>> 13)) >>> 0;
  return x >>> 0;
}

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length];
}

function scoreTier(score: number): 0 | 1 | 2 | 3 {
  if (score >= 85) return 3;
  if (score >= 70) return 2;
  if (score >= 50) return 1;
  return 0;
}

/**
 * Pick 3 distinct hashtags personalised by user_id seed. Ordering: one
 * MBTI/element keyword, one element/MBTI keyword, one score keyword.
 */
export function deriveMatchKeywords(c: MatchCandidate): string[] {
  const seedA = seedFrom(c.user_id, 1);
  const seedB = seedFrom(c.user_id, 2);
  const seedC = seedFrom(c.user_id, 3);

  const out: string[] = [];

  if (c.mbti && MBTI_KEYWORDS[c.mbti]) {
    out.push(pick(MBTI_KEYWORDS[c.mbti], seedA));
    out.push(pick(MBTI_KEYWORDS[c.mbti], seedA + 1));
  } else if (c.dominant_element && ELEMENT_KEYWORDS[c.dominant_element]) {
    out.push(pick(ELEMENT_KEYWORDS[c.dominant_element], seedA));
  }

  if (c.dominant_element && ELEMENT_KEYWORDS[c.dominant_element]) {
    const el = pick(ELEMENT_KEYWORDS[c.dominant_element], seedB);
    if (!out.includes(el)) out.push(el);
  }

  out.push(pick(SCORE_KEYWORDS[scoreTier(c.score)], seedC));

  // De-dupe and pad to 3 with a fallback bag.
  const seen = new Set(out);
  const filler = ["#새로운인연", "#운명의실타래", "#합이좋은", "#기대되는만남"];
  let i = 0;
  while (seen.size < 3 && i < filler.length) {
    seen.add(filler[(seedC + i) % filler.length]);
    i += 1;
  }
  return Array.from(seen).slice(0, 3);
}

// --- Tagline generation ---------------------------------------------------

const ELEMENT_TONE: Record<string, string> = {
  목: "성장하는",
  화: "열정적인",
  토: "안정적인",
  금: "단단한",
  수: "잔잔한",
};

const MBTI_TONE: Record<string, string> = {
  T: "이성적이고 명확한",
  F: "따뜻하고 섬세한",
};

const TIP_TEMPLATES_BY_TIER: readonly (readonly string[])[] = [
  // tier 0: <50 — careful, growth-oriented framing
  [
    "{element}성향 두 분이라면 작은 대화부터 진심을 쌓아가보세요.",
    "차이를 인정하면 오히려 깊어지는 인연이 될 수 있어요.",
    "처음은 어색해도 솔직한 대화가 거리감을 좁혀줄 거예요.",
    "서로의 다름을 배움으로 받아들이면 의외로 잘 맞을 수 있어요.",
  ],
  // tier 1: 50-69 — comfortable + steady
  [
    "{element} 기운이 어우러져 편안한 일상이 어울리는 인연이에요.",
    "서두르지 않아도 차차 통하는 사이가 될 가능성이 보여요.",
    "{element}성향답게 함께 있으면 마음이 편안해질 거예요.",
    "잔잔한 만남이 오히려 잘 어울리는 사주의 조합이에요.",
  ],
  // tier 2: 70-84 — strong chemistry
  [
    "{element}성향과 {mbtiTone} 매력이 만나 케미가 좋은 인연이에요.",
    "서로의 부족함을 채워주는 안정감 있는 관계가 될 거예요.",
    "함께 있으면 자연스럽게 대화가 이어지는 사주 궁합이에요.",
    "{mbtiTone} 분위기가 잘 어울려 만남이 즐거울 가능성이 커요.",
  ],
  // tier 3: 85+ — strong fit
  [
    "{element}성향과 {mbtiTone} 매력이 만나 평생 함께할 수 있는 운명의 인연이에요.",
    "두 분의 일주가 깊은 신뢰와 안정감을 만들어주는 천생연분이에요.",
    "{element} 기운이 잘 통해 서로에게 가장 편안한 사람이 될 거예요.",
    "장기적으로 금전운·관계운까지 함께 좋아지는 흔치 않은 사주 조합이에요.",
  ],
];

const GENERIC_FALLBACK_BY_TIER: readonly string[] = [
  "처음엔 어색해도 차차 마음이 통하는 인연일 수 있어요.",
  "서로 다른 점이 매력으로 느껴지는 새로운 인연이에요.",
  "함께라면 안정적인 분위기를 만들 수 있는 인연이에요.",
  "사주 궁합이 매우 좋아 운명적인 인연으로 발전할 수 있어요.",
];

function mbtiToneFor(mbti: string | null): string | null {
  if (!mbti || mbti.length !== 4) return null;
  // T/F는 감정 표현, J/P는 페이스. 두 축을 합쳐 짧은 톤 어휘 반환.
  const tf = mbti[2].toUpperCase() === "T" ? "이성적이고 명확한" : "따뜻하고 섬세한";
  const jp = mbti[3].toUpperCase() === "J" ? "계획적인" : "자유로운";
  return `${tf} ${jp}`;
}

/**
 * Tagline shown under the modal's age/MBTI block. Personalised by
 * user_id, score tier, dominant element, MBTI tone — produces dozens of
 * distinct sentences instead of 5.
 */
export function matchModalTip(c: MatchCandidate): string {
  const tier = scoreTier(c.score);
  const seed = seedFrom(c.user_id, 7);

  const elementWord = c.dominant_element
    ? ELEMENT_TONE[c.dominant_element] ?? "조화로운"
    : "조화로운";
  const mbtiTone = mbtiToneFor(c.mbti) ?? "균형 잡힌";

  // If neither MBTI nor element resolved, fall back to generic per tier.
  if (!c.dominant_element && !c.mbti) {
    return GENERIC_FALLBACK_BY_TIER[tier];
  }

  const template = pick(TIP_TEMPLATES_BY_TIER[tier], seed);
  return template.replace("{element}", elementWord).replace("{mbtiTone}", mbtiTone);
}

// --- Match card bottom comment ------------------------------------------

const CARD_COMMENT_BY_TIER: readonly (readonly string[])[] = [
  ["새로운 시작", "차차 통할 인연", "성장하는 만남", "배움이 있는 인연"],
  ["편안한 인연", "잔잔한 호흡", "안정적인 만남", "차분히 깊어지는"],
  ["케미가 좋은", "잘 통하는 사주", "호감 가득", "서로 보완하는"],
  ["운명적 인연", "평생 함께할", "찰떡 궁합", "천생연분 사주"],
];

/** Diverse short caption used as the bottom line of MatchCard. */
export function matchCardComment(c: MatchCandidate): string {
  const tier = scoreTier(c.score);
  const seed = seedFrom(c.user_id, 11);
  return pick(CARD_COMMENT_BY_TIER[tier], seed);
}