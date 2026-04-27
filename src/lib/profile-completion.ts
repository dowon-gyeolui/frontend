/**
 * Profile completion percentage shown on home / mypage as the "인연 탐색기
 * 가동률" gauge. Weights are spec'd by product:
 *
 *   기본 필수 정보 입력  (이름 + 생년월일 + 성별)        30%
 *   시간 (출생 시간)                                  +10%
 *   프로필 사진 추가     (카카오톡 기본 OR 변경)         +20%
 *   한 줄 자기소개 추가                                +20%   (※ 백엔드 필드 없음 — 항상 0)
 *   기본 정보 입력       (키/MBTI/직업 등)             +20%   (※ 백엔드 필드 없음 — 항상 0)
 *                                                   ─────
 *                                                   100%
 *
 * The two TODO entries lock at 0 until the backend exposes a `bio` field
 * and a structured "기본 정보" record. Today's max is therefore 60%.
 */

export type CompletionInput = {
  nickname: string | null | undefined;
  birth_date: string | null | undefined;
  birth_time?: string | null | undefined;
  gender?: string | null | undefined;
  photo_url?: string | null | undefined;
  /** Optional — reserved for the upcoming `bio` field. */
  bio?: string | null | undefined;
  /** Optional — reserved for the upcoming "기본 정보" group (height/MBTI/job…). */
  has_basic_info?: boolean;
};

export type CompletionRow = {
  label: string;
  pct: number;        // weight (e.g. 30, 10, 20, 20, 20)
  earned: boolean;    // does the user satisfy this row right now?
};

export function completionRows(me: CompletionInput | null): CompletionRow[] {
  const has = (v: unknown) => v !== null && v !== undefined && v !== "";
  const required = has(me?.nickname) && has(me?.birth_date) && has(me?.gender);
  return [
    { label: "기본 필수 정보 입력", pct: 30, earned: required },
    { label: "시간 (출생 시간)", pct: 10, earned: has(me?.birth_time) },
    { label: "프로필 사진 추가", pct: 20, earned: has(me?.photo_url) },
    { label: "한 줄 자기소개 추가", pct: 20, earned: has(me?.bio) },
    { label: "기본 정보 입력", pct: 20, earned: !!me?.has_basic_info },
  ];
}

export function profileCompletionPct(me: CompletionInput | null): number {
  if (!me) return 0;
  return completionRows(me).reduce(
    (sum, row) => sum + (row.earned ? row.pct : 0),
    0,
  );
}