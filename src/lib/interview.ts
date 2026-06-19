/**
 * 연애 인터뷰 질문 카탈로그 — 온보딩 마지막 단계에서 카테고리별로 노출.
 *
 * 사용자는 원하는 질문만 체크해 답하고, 답한 질문이 프로필에 노출된다.
 * 노출은 상호주의(맞팔) — 상대가 답한 개수만큼만 내 답을 볼 수 있다(서버 처리).
 *
 * question key 는 DB(interview_answers.question_key)에 저장되는 안정적 식별자다.
 * 질문 문구를 바꿔도 key 는 유지할 것(기존 답변 보존).
 */

export type InterviewQuestion = { key: string; text: string };
export type InterviewCategory = { category: string; questions: InterviewQuestion[] };

export const INTERVIEW_CATEGORIES: InterviewCategory[] = [
  {
    category: "일상/데이트 스타일",
    questions: [
      { key: "life_dayoff", text: "쉬는 날 나는 주로 어떻게 보내나요?" },
      { key: "life_habit_match", text: "연인과 꼭 맞았으면 하는 생활 습관은?" },
      { key: "life_date_style", text: "데이트는 집콕과 외출 중 어디에 가까운가요?" },
      { key: "humor_small_happiness", text: "내가 생각하는 최고의 소소한 행복은?" },
    ],
  },
  {
    category: "연애 성향/감정 표현",
    questions: [
      { key: "life_dating_type", text: "나는 연애할 때 어떤 사람에 가까운가요?" },
      { key: "love_affection", text: "애정표현은 말, 행동, 스킨십 중 어디에 가까운가요?" },
      { key: "love_conflict", text: "갈등이 생겼을 때 나는 어떻게 푸는 편인가요?" },
      { key: "love_hurt", text: "상대에게 서운함을 느낄 때 나는 보통?" },
      { key: "charm_crush", text: "내가 좋아하는 사람 앞에서 달라지는 점은?" },
    ],
  },
  {
    category: "연애 속도/가치관",
    questions: [
      { key: "pace_speed", text: "나는 천천히 알아가는 편인가요, 빠르게 가까워지는 편인가요?" },
      { key: "pace_deepening", text: "관계가 깊어진다고 느끼는 순간은?" },
      { key: "value_dealbreaker", text: "연애에서 절대 가볍게 넘기기 어려운 건?" },
      { key: "value_good_person", text: "나에게 좋은 사람이라는 건 어떤 사람인가요?" },
    ],
  },
  {
    category: "현실적인 모습",
    questions: [
      { key: "real_balance", text: "친구, 일, 연애의 균형은 어느 정도가 편한가요?" },
      { key: "real_busy", text: "연인이 바빠질 때 나는 어떤 관계 방식을 원하나요?" },
      { key: "charm_closer", text: "가까워지면 드러나는 내 모습은?" },
    ],
  },
];

/** question key → 질문 문구. 프로필에서 답변과 함께 질문을 표시할 때 사용. */
export const INTERVIEW_QUESTION_MAP: Record<string, string> = Object.fromEntries(
  INTERVIEW_CATEGORIES.flatMap((c) => c.questions.map((q) => [q.key, q.text])),
);
