"use client";

import { MessageCircle } from "lucide-react";

import { ZamiLogo } from "@/components/brand/zami-logo";
import { API_URL } from "@/lib/config";

export default function LoginScreen() {
  const handleKakaoLogin = () => {
    window.location.href = `${API_URL}/auth/kakao`;
  };

  return (
    <div
      className="relative flex min-h-dvh w-full flex-1 flex-col items-center overflow-hidden"
      style={{
        background:
          "linear-gradient(to bottom, #12081f 0%, #2a0e4f 50%, #5e35b1 100%)",
      }}
    >
      <div className="flex flex-1 items-center justify-center">
        <ZamiLogo size="lg" />
      </div>

      <div className="w-full px-[44px] pb-[170px]">
        <button
          type="button"
          onClick={handleKakaoLogin}
          className="flex h-[55px] w-full items-center justify-center gap-2 rounded-[5px] bg-[#fbe44e] text-[18px] font-semibold text-black transition-opacity hover:opacity-90 active:opacity-80"
        >
          <MessageCircle className="size-[19px] fill-black stroke-black" />
          <span>5초 만에 카카오로 시작하기</span>
        </button>
      </div>
    </div>
  );
}
