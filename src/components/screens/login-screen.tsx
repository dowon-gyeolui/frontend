"use client";
// 역할 설명: 첫 화면 — 아이디/비밀번호 로그인 + 카카오 로그인 두 경로를 함께 제공

import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ZamiLogo } from "@/components/brand/zami-logo";
import { saveToken } from "@/lib/auth";
import { API_URL } from "@/lib/config";
import { registerForPushNotifications } from "@/lib/push";

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canLogin = username.trim().length > 0 && password.length > 0 && !submitting;

  const handleKakaoLogin = () => {
    window.location.href = `${API_URL}/auth/kakao`;
  };

  const handleIdLogin = async () => {
    if (!canLogin) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (!res.ok) {
        setError(
          res.status === 401
            ? "아이디 또는 비밀번호가 올바르지 않아요."
            : "로그인 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
        );
        return;
      }
      const data = (await res.json()) as { token: string; is_new: boolean };
      saveToken(data.token);
      void registerForPushNotifications();
      router.push(data.is_new ? "/onboarding/account" : "/home");
    } catch {
      setError("네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="relative flex min-h-dvh w-full flex-1 flex-col items-center overflow-hidden"
      style={{
        background:
          "linear-gradient(to bottom, #12081f 0%, #2a0e4f 50%, #5e35b1 100%)",
      }}
    >
      <div className="flex flex-1 items-center justify-center pt-[40px]">
        <ZamiLogo size="lg" />
      </div>

      <div className="w-full px-[40px]">
        {/* 아이디 로그인 */}
        <div className="flex flex-col gap-[10px]">
          <input
            type="text"
            inputMode="text"
            autoComplete="username"
            placeholder="아이디"
            value={username}
            onChange={(e) => setUsername(e.target.value.trim())}
            maxLength={20}
            className="h-[52px] w-full rounded-[12px] border border-[#5a3a82] bg-[#352052] px-4 text-center text-[16px] font-medium text-white placeholder:text-white/60 focus:border-white/60 focus:outline-none"
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleIdLogin()}
            maxLength={64}
            className="h-[52px] w-full rounded-[12px] border border-[#5a3a82] bg-[#352052] px-4 text-center text-[16px] font-medium text-white placeholder:text-white/60 focus:border-white/60 focus:outline-none"
          />
          {error && (
            <p className="text-center text-[13px] text-red-300">{error}</p>
          )}
          <button
            type="button"
            onClick={handleIdLogin}
            disabled={!canLogin}
            className={`h-[52px] w-full rounded-[5px] text-[17px] font-semibold transition ${
              canLogin
                ? "bg-[#6366f1] text-white shadow-[0px_4px_15px_-2px_rgba(99,102,241,0.5)] hover:opacity-90"
                : "bg-[rgba(75,58,112,0.7)] text-white/40"
            }`}
          >
            {submitting ? "로그인 중..." : "아이디로 로그인"}
          </button>
        </div>

        {/* 구분선 */}
        <div className="my-[16px] flex items-center gap-[10px]">
          <span className="h-px flex-1 bg-white/15" />
          <span className="text-[12px] text-white/40">또는</span>
          <span className="h-px flex-1 bg-white/15" />
        </div>

        {/* 카카오 로그인/가입 */}
        <button
          type="button"
          onClick={handleKakaoLogin}
          className="flex h-[55px] w-full items-center justify-center gap-2 rounded-[5px] bg-[#fbe44e] text-[18px] font-semibold text-black transition-opacity hover:opacity-90 active:opacity-80"
        >
          <MessageCircle className="size-[19px] fill-black stroke-black" />
          <span>카카오로 시작하기</span>
        </button>
        <p className="mt-[12px] text-center text-[12px] text-white/50">
          처음이신가요? 카카오로 시작하면 바로 가입돼요.
        </p>
      </div>

      <footer className="mt-[24px] w-full px-[24px] pb-[28px]">
        <div className="flex items-center justify-center gap-[10px] text-[12px] text-white/70">
          <Link href="/terms" className="hover:text-white/90">
            이용약관
          </Link>
          <span className="text-white/25">|</span>
          <Link href="/privacy" className="hover:text-white/90">
            개인정보처리방침
          </Link>
        </div>
        <div className="mt-[12px] space-y-[2px] text-center text-[11px] leading-[16px] text-white/40">
          <p>상호: 멜로비 · 대표자: 김병철</p>
          <p>사업자등록번호: 315-03-92937</p>
          <p>서울특별시 강남구 강남대로 354, 11층 889호(역삼동, 혜천빌딩)</p>
          <p>고객센터: 010-9363-8833 · 이메일: thunderbolt9410@gmail.com</p>
        </div>
      </footer>
    </div>
  );
}
