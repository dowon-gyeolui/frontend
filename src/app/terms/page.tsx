"use client";
// 이용약관 페이지 (/terms) — 이용약관 + 유료 서비스(스타)·환불 규정 정적 약관 문서

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";

export default function TermsPage() {
  const router = useRouter();

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
            이용약관
          </h1>
        </div>

        <div className="mt-[20px] space-y-[6px] text-center text-[12px] text-white/50">
          <p>시행일: 2026년 08월 01일</p>
          <p>최종 업데이트: 2026년 07월 19일</p>
        </div>

        <div className="mt-[20px] space-y-[10px] text-[13px] leading-[21px] text-white/80 text-ko">
          <p>
            본 약관은 ZAMI(이하 &quot;회사&quot;)가 제공하는 사주·자미두수 기반
            인연 매칭 및 대화 서비스(이하 &quot;서비스&quot;)의 이용과 관련하여
            회사와 이용자 간의 권리, 의무 및 책임 사항을 정합니다.
          </p>
          <p>
            서비스에 가입하거나 서비스를 이용하는 경우 본 약관에 동의한 것으로
            봅니다.
          </p>
        </div>

        <div className="mt-[28px] space-y-[28px]">
          <Section title="1. 목적 및 정의">
            <P>
              본 약관은 회사가 제공하는 서비스의 이용 조건과 절차, 회사와
              이용자의 권리·의무, 유료 서비스 및 환불에 관한 사항을 정하는 것을
              목적으로 합니다.
            </P>
            <P>본 약관에서 사용하는 용어의 뜻은 다음과 같습니다.</P>
            <Table
              head={["용어", "정의"]}
              rows={[
                ["서비스", "ZAMI가 제공하는 사주·자미두수 풀이, 인연 매칭, 대화 등 일체의 기능"],
                ["이용자", "본 약관에 동의하고 서비스에 가입하여 이용하는 자"],
                ["계정", "카카오 로그인 등으로 생성되는 이용자 식별 단위"],
                ["스타", "유료 기능 이용을 위해 서비스 내에서 구매·사용하는 디지털 재화"],
              ]}
            />
          </Section>

          <Section title="2. 계정 및 가입">
            <P>
              서비스 가입은 카카오 계정 로그인을 통해 이루어지며, 회원가입 시
              본 약관과 개인정보처리방침에 동의해야 합니다.
            </P>
            <Quote>
              ZAMI는 인연 매칭·대화 서비스의 특성상 만 19세 이상 성인만 가입할
              수 있습니다.
            </Quote>
            <SimpleList
              items={[
                "이용자는 1인 1계정을 원칙으로 하며, 계정을 타인에게 양도하거나 대여할 수 없습니다.",
                "이용자는 생년월일, 성별 등 가입 시 입력하는 정보를 사실대로 제공해야 합니다.",
                "허위 정보로 가입한 사실이 확인되는 경우 회사는 서비스 이용을 제한하거나 계약을 해지할 수 있습니다.",
                "이용자는 언제든지 마이페이지에서 탈퇴할 수 있으며, 탈퇴 시 관련 법령에 따라 보관이 필요한 정보를 제외한 개인정보는 삭제됩니다.",
              ]}
            />
          </Section>

          <Section title="3. 서비스 내용">
            <P>회사는 다음과 같은 서비스를 제공합니다.</P>
            <Table
              head={["구분", "내용"]}
              rows={[
                ["사주·자미두수 풀이", "이용자의 출생 정보를 기반으로 한 명식·차트 분석 및 해석 제공"],
                ["인연 매칭", "사주 기반 궁합 분석과 선호 조건을 반영한 상대 추천"],
                ["대화", "매칭된 이용자 간 채팅 기능 제공"],
                ["유료 기능", "스타를 사용한 인연 카드 추가 열람 등 부가 기능"],
              ]}
            />
            <P>
              사주·자미두수 풀이와 매칭 결과는 참고용 정보이며, 특정 관계의
              성립이나 결과를 보증하지 않습니다.
            </P>
            <P>
              회사는 서비스의 내용을 운영상·기술상 필요에 따라 변경할 수 있으며,
              중요한 변경은 사전에 공지합니다.
            </P>
          </Section>

          <Section title="4. 금지행위 및 이용 제한">
            <P>이용자는 서비스 이용 시 다음 행위를 해서는 안 됩니다.</P>
            <NumberedList
              items={[
                { desc: "허위 프로필 작성, 타인의 사진·정보 도용, 타인 사칭" },
                { desc: "다른 이용자의 연락처, 사진, 대화 내용 등 개인정보를 동의 없이 수집·공개·유출하는 행위" },
                { desc: "욕설, 모욕, 협박, 성희롱, 스토킹 등 다른 이용자에 대한 괴롭힘" },
                { desc: "영리 목적의 광고, 스팸, 유흥·성매매 알선 등 서비스 목적 외 이용" },
                { desc: "음란물, 불법 촬영물 등 법령에 위반되는 콘텐츠의 게시·전송" },
                { desc: "서비스의 정상적인 운영을 방해하는 행위(자동화 프로그램 사용, 시스템 침입 시도 등)" },
              ]}
            />
            <P>
              회사는 안전한 서비스 운영을 위해 프로필 사진과 채팅 메시지에 대해
              자동화된 검수(모더레이션)를 시행할 수 있으며, 금지행위가 확인된
              경우 게시물 삭제, 메시지 차단, 서비스 이용 제한, 계정 정지 또는
              이용계약 해지 조치를 할 수 있습니다.
            </P>
            <P>
              이용자는 다른 이용자의 금지행위를 신고할 수 있으며, 회사는 신고
              내용을 확인하여 필요한 조치를 취합니다.
            </P>
          </Section>

          <Section title="5. 유료 서비스: 스타">
            <P>
              회사는 인연 카드 추가 열람 등 일부 기능을 유료로 제공하며, 이를
              위한 디지털 재화로 &quot;스타&quot;를 판매합니다.
            </P>
            <SimpleList
              items={[
                "스타의 가격, 구성, 사용 가능한 기능은 서비스 내 스토어 화면에 표시됩니다.",
                "스타는 결제 완료 즉시 계정에 적립되며, 유료 기능 사용 시 차감됩니다.",
                "스타는 현금이 아니며, 타인에게 양도하거나 현금으로 교환할 수 없습니다.",
                "회사는 이벤트 등으로 스타를 무상 지급할 수 있으며, 무상으로 지급된 스타는 환불 대상에서 제외됩니다.",
              ]}
            />
          </Section>

          <Section title="6. 환불 규정">
            <P>
              회사는 「전자상거래 등에서의 소비자보호에 관한 법률」 등 관련
              법령에 따라 다음과 같이 청약철회 및 환불을 처리합니다.
            </P>
            <Table
              head={["구분", "환불 기준"]}
              rows={[
                ["미사용 스타", "구매일로부터 7일 이내 청약철회(전액 환불) 가능"],
                ["일부 사용한 스타", "이미 사용한 스타에 해당하는 금액을 차감한 후 잔여분 환불"],
                ["무상 지급 스타", "환불 대상 아님"],
                ["앱스토어/플레이스토어 결제분", "해당 스토어(Apple App Store, Google Play)의 환불 정책 및 절차에 따름"],
              ]}
            />
            <SimpleList
              items={[
                "환불은 서비스 내 문의 또는 아래 사업자 정보의 연락처 이메일로 요청할 수 있습니다.",
                "환불 요청 접수 후 관련 법령이 정한 기간 내에 결제 수단별 절차에 따라 환불합니다.",
                "이용자의 귀책 사유로 이용이 제한·정지된 경우에도 미사용 스타에 대한 환불은 관련 법령에 따라 처리합니다.",
              ]}
            />
          </Section>

          <Section title="7. 서비스 중단 및 책임 제한">
            <P>
              회사는 시스템 점검, 설비 교체, 통신 장애, 천재지변 등 부득이한
              사유가 있는 경우 서비스 제공을 일시적으로 중단할 수 있으며, 이
              경우 사전 또는 사후에 공지합니다.
            </P>
            <SimpleList
              items={[
                "사주·자미두수 풀이 및 매칭 결과는 참고용 정보로, 회사는 그 정확성이나 특정 결과를 보증하지 않습니다.",
                "이용자 간 대화, 만남 등 상호 교류 과정에서 발생한 분쟁에 대해 회사는 고의 또는 중대한 과실이 없는 한 책임을 지지 않습니다.",
                "회사의 책임은 관련 법령이 허용하는 범위 내에서 제한됩니다.",
              ]}
            />
          </Section>

          <Section title="8. 분쟁 해결 및 준거법">
            <P>
              본 약관과 서비스 이용에 관한 사항은 대한민국 법령을 준거법으로
              합니다.
            </P>
            <P>
              회사와 이용자 간 분쟁이 발생한 경우 상호 성실히 협의하여 해결하며,
              협의가 이루어지지 않는 경우 민사소송법에 따른 관할법원에 소를
              제기할 수 있습니다.
            </P>
          </Section>

          <Section title="9. 사업자 정보">
            <Table
              head={["구분", "내용"]}
              rows={[
                ["상호", "【상호】"],
                ["대표자", "【대표자】"],
                ["사업자등록번호", "【사업자등록번호】"],
                ["통신판매업신고번호", "【통신판매업신고번호】"],
                ["연락처 이메일", "【연락처 이메일】"],
              ]}
            />
            <P small>
              ※ 사업자 정보는 사업자 등록 및 통신판매업 신고 완료 후 확정
              기재됩니다.
            </P>
          </Section>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-[12px]">
      <h2 className="text-[16px] font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}

function P({ children, small }: { children: ReactNode; small?: boolean }) {
  return (
    <p
      className={
        small
          ? "text-[11px] leading-[17px] text-white/50"
          : "text-[13px] leading-[21px] text-white/80"
      }
    >
      {children}
    </p>
  );
}

function Quote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[12px] border border-white/15 bg-white/5 p-[14px] text-center text-[13px] leading-[20px] text-white/85">
      {children}
    </div>
  );
}

function SimpleList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-[4px] pl-[18px] text-[13px] leading-[20px] text-white/80">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function NumberedList({
  items,
}: {
  items: { title?: string; desc: string }[];
}) {
  return (
    <ol className="space-y-[8px] text-[13px] leading-[20px] text-white/80">
      {items.map((item, i) => (
        <li key={i} className="flex gap-[8px]">
          <span className="shrink-0 font-bold text-white/50">{i + 1}.</span>
          <span>
            {item.title && <b className="text-white">{item.title}</b>}
            {item.title && <br />}
            {item.desc}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-[12px] border border-white/15">
      <table className="w-full min-w-[420px] border-collapse text-left text-[11px]">
        <thead>
          <tr className="bg-white/10">
            {head.map((h, i) => (
              <th
                key={i}
                className="border-b border-white/15 px-[10px] py-[8px] font-semibold text-white/90"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white/[0.02]" : ""}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className="border-b border-white/10 px-[10px] py-[8px] align-top leading-[16px] text-white/70"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
