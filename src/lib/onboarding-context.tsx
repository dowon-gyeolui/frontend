"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Onboarding state lives in a React context so each step can read/write
 * across page navigations. We keep it client-only and intentionally simple:
 * a flat object of optional fields, plus a single `update(...)` to set
 * any subset.
 *
 * The final submission (PATCH /users/me/profile + POST /users/me/birth-data)
 * happens on the Done screen — until then, no API calls. This avoids
 * partial saves if the user backs out mid-flow.
 */
export type Gender = "male" | "female";
export type CalendarType = "solar" | "lunar";

export type OnboardingState = {
  nickname?: string;
  gender?: Gender;
  birth_date?: string; // YYYY-MM-DD
  calendar_type?: CalendarType;
  is_leap_month?: boolean;
  birth_time?: string; // HH:MM (24h)
  birth_place?: string; // 출생지 — 시·도 단위
  // 이상형(필수) — 오늘의 인연 후보 필터링용
  pref_age_min?: number;
  pref_age_max?: number;
  pref_region?: string; // 선호 지역 — 시·도 단위
  pref_height_min?: number;
  // 연애 인터뷰(선택) — 답한 질문만. done 단계에서 PUT /users/me/interview.
  interview?: { question_key: string; answer: string }[];
};

type OnboardingCtx = {
  state: OnboardingState;
  update: (patch: Partial<OnboardingState>) => void;
  reset: () => void;
};

const Ctx = createContext<OnboardingCtx | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>({});

  const update = useCallback((patch: Partial<OnboardingState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => setState({}), []);

  const value = useMemo(() => ({ state, update, reset }), [state, update, reset]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useOnboarding must be used inside <OnboardingProvider>");
  }
  return ctx;
}