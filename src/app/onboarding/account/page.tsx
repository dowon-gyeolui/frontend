"use client";
// 온보딩 1단계(/onboarding/account) — 아이디/비밀번호 회원가입 입력 페이지

import { useRouter } from "next/navigation";
import { useState } from "react";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { apiFetch, ApiError } from "@/lib/api";
import { useOnboarding } from "@/lib/onboarding-context";

const USERNAME_RE = /^[a-zA-Z0-9_]{4,20}$/;

export default function OnboardingAccountPage() {
  const router = useRouter();
  const { state, update } = useOnboarding();

  const [username, setUsername] = useState(state.username ?? "");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const usernameValid = USERNAME_RE.test(username);
  const passwordValid = password.length >= 8 && password.length <= 64;
  const passwordMatches = password.length > 0 && password === passwordConfirm;
  const canContinue = usernameValid && passwordValid && passwordMatches && !submitting;

  const onNext = async () => {
    if (!canContinue) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/users/me/credentials", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      update({ username });
      router.push("/onboarding/name");
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setError("이미 사용 중인 아이디예요.");
      } else {
        setError(e instanceof Error ? e.message : "회원가입 중 오류가 발생했어요.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OnboardingShell step={1}>
      <div className="flex flex-1 flex-col px-[36px] pb-[40px]">
        <div className="flex flex-1 flex-col justify-start gap-[20px] pt-[40px]">
          <h1 className="text-center text-[24px] font-bold tracking-tight text-white">
            아이디와 비밀번호를
            <br />
            설정해주세요
          </h1>

          <input
            type="text"
            inputMode="text"
            placeholder="아이디 (영문/숫자/밑줄 4~20자)"
            value={username}
            onChange={(e) => setUsername(e.target.value.trim())}
            maxLength={20}
            className="h-[52px] w-full rounded-[12px] border border-[#5a3a82] bg-[#352052] px-4 text-center text-[18px] font-medium text-white placeholder:text-white/70 focus:border-white/60 focus:outline-none"
          />

          <input
            type="password"
            placeholder="비밀번호 (8자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={64}
            className="h-[52px] w-full rounded-[12px] border border-[#5a3a82] bg-[#352052] px-4 text-center text-[18px] font-medium text-white placeholder:text-white/70 focus:border-white/60 focus:outline-none"
          />

          <input
            type="password"
            placeholder="비밀번호 확인"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            maxLength={64}
            className="h-[52px] w-full rounded-[12px] border border-[#5a3a82] bg-[#352052] px-4 text-center text-[18px] font-medium text-white placeholder:text-white/70 focus:border-white/60 focus:outline-none"
          />

          {password.length > 0 && !passwordValid && (
            <p className="text-center text-[13px] text-red-300">
              비밀번호는 8자 이상 64자 이하로 입력해주세요.
            </p>
          )}
          {passwordConfirm.length > 0 && !passwordMatches && (
            <p className="text-center text-[13px] text-red-300">
              비밀번호가 일치하지 않아요.
            </p>
          )}
          {error && (
            <p className="text-center text-[13px] text-red-300">{error}</p>
          )}
        </div>

        <button
          type="button"
          disabled={!canContinue}
          onClick={onNext}
          className={`mt-[40px] h-[52px] w-full rounded-[5px] text-[18px] font-semibold transition ${
            canContinue
              ? "bg-[#6366f1] text-white shadow-[0px_4px_15px_-2px_rgba(99,102,241,0.5)] hover:opacity-90"
              : "bg-[rgba(75,58,112,0.7)] text-white/40"
          }`}
        >
          {submitting ? "확인 중..." : "다음"}
        </button>
      </div>
    </OnboardingShell>
  );
}