"use client";
// FAQ 페이지 (/settings/faq) — 설정 허브에서 진입하는 자주 묻는 질문 목록.
// 뒤로가기 헤더 + 아코디언. 문구는 앱 실제 기능(오늘의 인연 4슬롯, 별 충전, 사진 인증,
// 신고/차단, 탈퇴 시 hard delete 등)에 맞춰 담백하게 작성했으며, 사용자가 이후 다듬을 수 있다.

import { ArrowLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AppShell } from "@/components/layout/app-shell";

const FAQS: { q: string; a: string }[] = [
  {
    q: "매칭은 어떻게 이뤄지나요?",
    a: "사주·자미두수 기반 궁합 분석과 회원님이 설정한 선호 조건을 함께 반영해 상대를 추천합니다. 추천 결과는 참고용 정보이며 특정 관계의 성립을 보증하지는 않습니다.",
  },
  {
    q: "오늘의 인연은 언제 갱신되나요?",
    a: "오늘의 인연은 매일 새롭게 갱신되며, 한 번에 최대 4명(4슬롯)까지 확인할 수 있습니다. 슬롯을 모두 사용한 경우 다음 갱신 때 새로운 인연을 만날 수 있어요.",
  },
  {
    q: "별(스타)은 무엇이고 어떻게 충전하나요?",
    a: "별(스타)은 인연 카드 추가 열람 등 일부 유료 기능을 이용할 때 사용하는 디지털 재화입니다. 스토어 화면에서 충전할 수 있고, 보유한 별 잔액은 마이페이지에서 확인할 수 있습니다.",
  },
  {
    q: "사진 인증(ZAMI 인증 뱃지)은 어떻게 하나요?",
    a: "마이페이지에서 얼굴이 잘 보이는 프로필 사진을 등록하면 자동 검수를 거칩니다. 검수를 통과하면 인증 뱃지가 표시되어 상대에게 더 신뢰감을 줄 수 있어요.",
  },
  {
    q: "상대를 차단하거나 신고하려면 어떻게 하나요?",
    a: "프로필 화면이나 대화방에서 신고·차단을 요청할 수 있습니다. 신고가 접수되면 내용을 확인해 필요한 조치를 취하며, 차단한 상대는 더 이상 회원님에게 추천되거나 연락할 수 없습니다.",
  },
  {
    q: "회원 탈퇴하면 내 데이터는 어떻게 되나요?",
    a: "탈퇴 시 프로필, 매칭 이력, 대화 내용 등 회원님의 기록은 삭제됩니다. 다만 관련 법령상 일정 기간 보관이 필요한 정보(예: 결제 기록)는 예외적으로 보관될 수 있습니다. 탈퇴 후에도 같은 카카오 계정으로 다시 가입할 수 있어요.",
  },
  {
    q: "결제·환불은 어떻게 하나요?",
    a: "아직 사용하지 않은 별은 구매일로부터 7일 이내 청약철회로 환불받을 수 있습니다. 앱스토어·플레이스토어를 통한 결제는 해당 스토어의 환불 정책을 따릅니다. 자세한 내용은 이용약관의 환불 규정을 참고하거나 문의하기로 연락해 주세요.",
  },
  {
    q: "프로필 정보는 어디서 수정하나요?",
    a: "마이페이지에서 프로필 사진, 자기소개, 기본 정보, 필수 정보(생년월일·출생 시간 등)를 언제든 수정할 수 있습니다. 프로필을 충분히 채울수록 매칭 품질이 좋아져요.",
  },
];

export default function FaqPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <AppShell>
      <div className="flex-1 px-[20px] pb-[40px]">
        <div className="relative pt-[14px]">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="뒤로"
            className="absolute left-0 top-[14px]"
          >
            <ArrowLeft className="size-[24px] stroke-white stroke-[2]" />
          </button>
          <h1 className="text-center text-[20px] font-bold text-white">
            자주 묻는 질문
          </h1>
        </div>

        <div className="mt-[24px] space-y-[10px]">
          {FAQS.map((item, index) => {
            const open = openIndex === index;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-[14px] border border-white/15 bg-white/10 backdrop-blur-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : index)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-[12px] px-[16px] py-[14px] text-left hover:bg-white/5"
                >
                  <span className="shrink-0 text-[15px] font-bold text-[#fde047]">
                    Q
                  </span>
                  <span className="flex-1 text-[14px] font-medium leading-[20px] text-white">
                    {item.q}
                  </span>
                  <ChevronRight
                    className={`size-[18px] shrink-0 stroke-white/40 stroke-[2] transition-transform duration-200 ease-out motion-reduce:transition-none ${
                      open ? "rotate-90" : ""
                    }`}
                  />
                </button>
                {open && (
                  <div className="border-t border-white/10 px-[16px] py-[14px]">
                    <p className="text-[13px] leading-[21px] text-white/80 text-ko">
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-[20px] text-center text-[12px] leading-[18px] text-white/45">
          궁금한 점이 더 있다면 설정 &gt; 문의하기로 연락해 주세요.
        </p>
      </div>
    </AppShell>
  );
}
