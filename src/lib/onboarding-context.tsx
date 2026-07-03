// 온보딩 단계 간 공유되는 React Context 상태(세션 저장, 최종 제출은 Done 화면에서).
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Gender = "male" | "female";
export type CalendarType = "solar" | "lunar";

export type OnboardingState = {
  nickname?: string;
  gender?: Gender;
  birth_date?: string;
  calendar_type?: CalendarType;
  is_leap_month?: boolean;
  birth_time?: string;
  birth_place?: string;
  pref_age_min?: number;
  pref_age_max?: number;
  pref_region?: string;
  pref_height_min?: number;
  interview?: { question_key: string; answer: string }[];
};

type OnboardingCtx = {
  state: OnboardingState;
  update: (patch: Partial<OnboardingState>) => void;
  reset: () => void;
};

const Ctx = createContext<OnboardingCtx | null>(null);

const SESSION_KEY = "onboarding-state";

function loadFromSession(): OnboardingState {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as OnboardingState;
  } catch {}
  return {};
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(loadFromSession);

  const update = useCallback((patch: Partial<OnboardingState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    setState({});
  }, []);

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