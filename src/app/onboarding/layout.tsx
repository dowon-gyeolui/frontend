// 온보딩(/onboarding/*) 레이아웃 — OnboardingProvider로 하위 페이지를 감쌈
import type { ReactNode } from "react";

import { OnboardingProvider } from "@/lib/onboarding-context";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <OnboardingProvider>{children}</OnboardingProvider>;
}