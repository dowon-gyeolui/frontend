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