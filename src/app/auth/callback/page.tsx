"use client";
// 카카오 OAuth 콜백 처리 페이지 (/auth/callback) — 토큰 저장 후 온보딩/홈으로 라우팅

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { saveToken } from "@/lib/auth";

function CallbackBackground({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-dvh w-full flex-1 items-center justify-center"
      style={{
        background:
          "linear-gradient(to bottom, #12081f 0%, #2a0e4f 50%, #5e35b1 100%)",
      }}
    >
      {children}
    </div>
  );
}

function CallbackHandler() {
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
    router.replace(isNew ? "/onboarding/account" : "/home");
  }, [params, router]);

  return (
    <CallbackBackground>
      <p className="text-white/80 text-sm">로그인 처리 중...</p>
    </CallbackBackground>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <CallbackBackground>
          <p className="text-white/80 text-sm">로딩 중...</p>
        </CallbackBackground>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}