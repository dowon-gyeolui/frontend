"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { saveToken } from "@/lib/auth";

/**
 * OAuth landing page.
 *
 * Backend's /auth/kakao/callback redirects here with ?token=...&is_new=0|1.
 * We persist the JWT and route the user to onboarding (new) or home (returning).
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    const isNew = params.get("is_new") === "1";

    if (!token) {
      router.replace("/?login_error=missing_token");
      return;
    }

    saveToken(token);
    router.replace(isNew ? "/onboarding/name" : "/home");
  }, [params, router]);

  return (
    <div
      className="flex min-h-dvh w-full flex-1 items-center justify-center"
      style={{
        background:
          "linear-gradient(to bottom, #12081f 0%, #2a0e4f 50%, #5e35b1 100%)",
      }}
    >
      <p className="text-white/80 text-sm">로그인 처리 중...</p>
    </div>
  );
}