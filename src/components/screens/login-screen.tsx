"use client";
// 역할 설명: 카카오 로그인 버튼을 보여주는 초기 로그인 화면

import { MessageCircle } from "lucide-react";
import Link from "next/link";

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

      <div className="w-full px-[44px]">
        <button
          type="button"
          onClick={handleKakaoLogin}
          className="flex h-[55px] w-full items-center justify-center gap-2 rounded-[5px] bg-[#fbe44e] text-[18px] font-semibold text-black transition-opacity hover:opacity-90 active:opacity-80"
        >
          <MessageCircle className="size-[19px] fill-black stroke-black" />
          <span>5초 만에 카카오로 시작하기</span>
        </button>
      </div>

      <footer className="mt-[28px] w-full px-[24px] pb-[36px]">
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
