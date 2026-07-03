// 프로필 완성도(가동률) 계산 — 홈/마이페이지 게이지에 사용.
export type CompletionInput = {
  nickname: string | null | undefined;
  birth_date: string | null | undefined;
  birth_time?: string | null | undefined;
  gender?: string | null | undefined;
  photo_url?: string | null | undefined;
  bio?: string | null | undefined;
  height_cm?: number | null | undefined;
  mbti?: string | null | undefined;
  job?: string | null | undefined;
  region?: string | null | undefined;
};

export type CompletionRow = {
  label: string;
  pct: number;
  earned: boolean;
};

export function completionRows(me: CompletionInput | null): CompletionRow[] {
  const has = (v: unknown) => v !== null && v !== undefined && v !== "";
  const required = has(me?.nickname) && has(me?.birth_date) && has(me?.gender);
  const hasBasicInfo =
    has(me?.height_cm) || has(me?.mbti) || has(me?.job) || has(me?.region);
  return [
    { label: "필수 정보 입력", pct: 30, earned: required },
    { label: "시간", pct: 10, earned: has(me?.birth_time) },
    { label: "프로필 사진 추가", pct: 20, earned: has(me?.photo_url) },
    { label: "한 줄 자기소개 추가", pct: 20, earned: has(me?.bio) },
    { label: "기본 정보 입력", pct: 20, earned: hasBasicInfo },
  ];
}

export function profileCompletionPct(me: CompletionInput | null): number {
  if (!me) return 0;
  return completionRows(me).reduce(
    (sum, row) => sum + (row.earned ? row.pct : 0),
    0,
  );
}