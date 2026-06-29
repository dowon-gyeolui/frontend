"use client";

import { ArrowLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { LoadingPanel } from "@/components/ui/loading-panel";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { CACHE_TTL, fetchWithCache } from "@/lib/cache";

// --- Types ---

type DeepStar = {
  name: string;
  name_ko: string;
  type: "main" | "lucky" | "unlucky" | "transform";
  sub: string | null;
};

type DeepPalace = {
  name: string;
  name_ko: string;
  branch: string;
  branch_ko: string;
  stem: string;
  stem_ko: string;
  stars: DeepStar[];
  description: string;
  app_title: string;
  summary: string;
  love_interpretation: string;
  love_tip: string;
  keywords: string[];
};

type DeepResponse = {
  user_id: number;
  interpretation_status: "pending" | "ready" | "partial";
  bureau_name: string;
  year_pillar: string;
  lunar_birth: string | null;
  hour_assumed: boolean;
  palaces: DeepPalace[];
  sources: string[];
};

type Me = { id: number; nickname: string | null };
type Step = "intro" | "detail";

// --- 12궁 표시 순서 ---
const PALACE_ORDER = [
  "명궁", "부처궁", "복덕궁", "질액궁", "천이궁",
  "재백궁", "전택궁", "관록궁", "노복궁", "형제궁", "자녀궁", "부모궁",
];

// --- 소개 페이지용 궁 설명 ---
const PALACE_INTRO: Record<string, { app_title: string; desc: string }> = {
  명궁: {
    app_title: "나의 기본 매력",
    desc: "처음 만났을 때 어떤 사람으로 보이는지 알려줘요.\n나의 첫인상, 분위기, 연애에서 자연스럽게 드러나는 태도를 볼 수 있어요.",
  },
  형제궁: {
    app_title: "편한 관계 케미",
    desc: "친구처럼 편안한 연애를 잘하는지 보여줘요.\n장난기, 소통 방식, 가까운 사람들과의 관계 스타일을 알 수 있어요.",
  },
  부처궁: {
    app_title: "내가 끌리는 사람",
    desc: "내가 어떤 상대에게 마음이 가는지 알려줘요.\n이상형, 연애 상대 취향, 잘 맞는 파트너의 분위기를 볼 수 있어요.",
  },
  자녀궁: {
    app_title: "관계의 미래감",
    desc: "연애가 깊어졌을 때 어떤 미래를 그리고 싶은지 보여줘요.\n오래 만났을 때의 모습, 함께 성장하는 방식, 장기 관계의 가능성을 볼 수 있어요.",
  },
  재백궁: {
    app_title: "데이트 돈 성향",
    desc: "연애할 때 돈을 어떻게 쓰는지 알려줘요.\n데이트 비용, 선물, 소비 습관, 금전적인 균형 감각을 볼 수 있어요.",
  },
  질액궁: {
    app_title: "연애 스트레스",
    desc: "연애 중 어떤 순간에 예민해지는지 보여줘요.\n서운함, 불안, 감정 기복, 갈등이 생겼을 때의 반응을 알 수 있어요.",
  },
  천이궁: {
    app_title: "인연이 생기는 곳",
    desc: "좋은 인연이 어떤 상황에서 들어오기 쉬운지 알려줘요.\n소개팅, 모임, 여행, 새로운 환경에서의 연애 기회를 볼 수 있어요.",
  },
  노복궁: {
    app_title: "주변 사람과의 케미",
    desc: "상대의 친구나 지인들과 어떻게 어울리는지 보여줘요.\n단체 모임, 소개팅 자리, 주변 평판에서 드러나는 매력을 알 수 있어요.",
  },
  관록궁: {
    app_title: "일과 연애 균형",
    desc: "일, 목표, 연애를 어떻게 함께 가져가는지 알려줘요.\n바쁠 때의 연애 태도, 커리어와 관계의 균형을 볼 수 있어요.",
  },
  전택궁: {
    app_title: "편안한 관계 방식",
    desc: "둘이 함께 있을 때 어떤 안정감을 원하는지 보여줘요.\n집 데이트, 편안한 공간, 오래 머무는 관계의 분위기를 알 수 있어요.",
  },
  복덕궁: {
    app_title: "연애 만족감",
    desc: "내가 어떤 연애에서 진짜 행복을 느끼는지 알려줘요.\n설렘, 안정감, 깊은 대화, 마음의 편안함을 볼 수 있어요.",
  },
  부모궁: {
    app_title: "진지한 관계의 분위기",
    desc: "관계가 깊어졌을 때 어떤 가치관이 중요해지는지 보여줘요.\n가족, 어른, 장기 관계, 결혼관과 연결되는 안정감을 볼 수 있어요.",
  },
};

// --- Page ---

export default function JamidusuPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [step, setStep] = useState<Step>("intro");
  const [data, setData] = useState<DeepResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    apiFetch<Me>("/users/me").then(setMe).catch(() => {});
    // 소개 페이지 보는 동안 미리 fetch
    fetchWithCache<DeepResponse>("/saju/me/jamidusu-deep", CACHE_TTL.saju, setData, {
      onError: (e: Error) => setError(e.message),
    });
  }, [router]);

  return (
    <AppShell>
      <div className="flex-1 px-[20px]">
        <div className="relative pt-[14px]">
          <button
            type="button"
            onClick={() =>
              step === "detail" ? setStep("intro") : router.push("/saju")
            }
            aria-label="뒤로"
            className="absolute left-0 top-[14px]"
          >
            <ArrowLeft className="size-[24px] stroke-white stroke-[2]" />
          </button>
          <h1 className="text-center text-[20px] font-bold text-white">
            자미두수
          </h1>
          <div className="mt-[10px] h-px bg-white/30" />
        </div>

        {step === "intro" ? (
          <IntroView onNext={() => setStep("detail")} />
        ) : (
          <DetailView nickname={me?.nickname ?? null} data={data} error={error} />
        )}
      </div>
    </AppShell>
  );
}

// --- 소개 페이지 ---

function IntroView({ onNext }: { onNext: () => void }) {
  return (
    <div className="pb-[40px]">
      <section className="mt-[24px] rounded-[18px] border border-purple-300/30 bg-gradient-to-br from-purple-900/40 via-purple-700/30 to-pink-700/30 p-[20px] backdrop-blur-sm">
        <h2 className="text-center text-[20px] font-bold text-white">
          자미두수로 보는 나의 연애 명반
        </h2>
        <p className="mt-[14px] text-[13px] leading-[22px] text-white/80 text-ko">
          자미두수는 생년월일시를 바탕으로 나의 성향, 인연, 관계 패턴을 읽어보는 동양 명리 분석이에요.
        </p>
        <p className="mt-[10px] text-[13px] leading-[22px] text-white/80 text-ko">
          이 분석에서는 어려운 용어보다, 실제 연애와 소개팅에서 도움이 되는 내용에 집중해요.
          나는 어떤 매력을 가진 사람인지, 어떤 상대에게 끌리는지, 어떤 관계에서 편안함을 느끼는지를
          12개의 궁으로 나누어 보여드립니다.
        </p>
        <p className="mt-[10px] text-[13px] leading-[22px] text-white/80 text-ko">
          MBTI가 나의 성격을 간단히 보여준다면, 자미두수는 나의 연애 성향을 조금 더 입체적으로 보여주는 방식이에요.
        </p>
      </section>

      <section className="mt-[14px] rounded-[14px] border border-white/15 bg-white/5 p-[16px]">
        <h3 className="text-[14px] font-bold text-white">이런 내용을 알 수 있어요</h3>
        <ul className="mt-[10px] space-y-[6px]">
          {[
            "나의 첫인상과 연애 매력",
            "내가 끌리는 이상형",
            "잘 맞는 상대와 조심해야 할 상대",
            "데이트 스타일과 돈 성향",
            "연애할 때 예민해지는 포인트",
            "인연이 시작되기 쉬운 장소와 상황",
          ].map((item) => (
            <li
              key={item}
              className="flex items-start gap-[8px] text-[13px] leading-[20px] text-white/80"
            >
              <span className="mt-[6px] size-[5px] shrink-0 rounded-full bg-pink-400" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-[14px] space-y-[8px]">
        <h3 className="text-[14px] font-bold text-white">12궁이 알려주는 것</h3>
        {PALACE_ORDER.map((name_ko) => {
          const p = PALACE_INTRO[name_ko];
          return (
            <div
              key={name_ko}
              className="rounded-[12px] border border-white/10 bg-white/5 p-[14px]"
            >
              <p className="text-[13px] font-bold text-white">
                {name_ko}
                <span className="ml-[6px] text-[12px] font-normal text-white/50">
                  {p.app_title}
                </span>
              </p>
              <p className="mt-[4px] whitespace-pre-line text-[12px] leading-[18px] text-white/60 text-ko">
                {p.desc}
              </p>
            </div>
          );
        })}
      </section>

      <section className="mt-[14px] rounded-[12px] border border-white/10 bg-white/5 p-[14px]">
        <p className="text-[12px] leading-[20px] text-white/55 text-ko">
          입력된 생년월일시와 자미두수 명반을 바탕으로, AI가 연애 관점에 맞게 쉽고 부드럽게 해석해드려요.
        </p>
        <p className="mt-[8px] text-[12px] leading-[20px] text-white/45 text-ko">
          이 분석은 정답을 정해주는 것이 아니라, 나를 더 잘 이해하고 좋은 관계를 선택하기 위한 참고용 콘텐츠입니다.
        </p>
      </section>

      <button
        type="button"
        onClick={onNext}
        className="mt-[24px] flex h-[50px] w-full items-center justify-center gap-[6px] rounded-[12px] bg-gradient-to-r from-yellow-300 to-pink-400 text-[15px] font-bold text-[#1b1029] shadow-[0_0_15px_-2px_rgba(253,224,71,0.5)] hover:opacity-90"
      >
        12궁 해석 보러가기
        <ChevronRight className="size-[18px]" />
      </button>
    </div>
  );
}

// --- 해석 페이지 ---

function DetailView({
  nickname,
  data,
  error,
}: {
  nickname: string | null;
  data: DeepResponse | null;
  error: string | null;
}) {
  const sortedPalaces = data
    ? [...data.palaces].sort((a, b) => {
        const ai = PALACE_ORDER.indexOf(a.name_ko);
        const bi = PALACE_ORDER.indexOf(b.name_ko);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      })
    : [];

  return (
    <>
      <section className="mt-[24px] rounded-[18px] border border-purple-300/30 bg-gradient-to-br from-purple-900/40 via-purple-700/30 to-pink-700/30 p-[20px] backdrop-blur-sm">
        <h2 className="text-center text-[22px] font-bold text-white">
          {data
            ? `${nickname ?? "나"}님의 자미두수 명반`
            : `${nickname ?? "나"}님의 자미두수 풀이중...`}
        </h2>
        {data?.bureau_name && (
          <p className="mt-[8px] text-center text-[12px] text-white/65">
            {data.year_pillar}년주 · {data.bureau_name}
            {data.lunar_birth && ` · 음력 ${data.lunar_birth}`}
          </p>
        )}
        {data?.hour_assumed && (
          <p className="mt-[6px] text-center text-[10px] text-yellow-200/80">
            출생 시간 입력하시면 더 정확해져요.
          </p>
        )}
      </section>

      {!data && !error && (
        <LoadingPanel
          className="mt-[24px]"
          estimatedMs={14000}
          done={!!data}
          messages={[
            { atPct: 0, text: "별자리 불러오는중..." },
            { atPct: 20, text: "자미두수를 계산하는 중..." },
            { atPct: 40, text: "원전 구절 가져오는 중..." },
            { atPct: 60, text: "자미두수 풀어내는 중..." },
            { atPct: 80, text: "내용 다듬는 중..." },
            { atPct: 90, text: "확인해보실까요?" },
          ]}
        />
      )}

      {error && (
        <section className="mt-[24px] rounded-[14px] border border-red-400/40 bg-red-500/10 p-[16px] text-center text-[12px] text-red-200">
          일시적으로 불러오지 못했어요. {error}
        </section>
      )}

      {data &&
        (data.interpretation_status === "ready" ||
          data.interpretation_status === "partial") &&
        sortedPalaces.length > 0 && (
          <section className="mt-[16px] space-y-[10px] pb-[40px]">
            {sortedPalaces.map((p) => (
              <PalaceCard key={p.name} palace={p} />
            ))}

            {data.sources.length > 0 && (
              <div className="rounded-[12px] border border-white/10 bg-white/5 p-[12px]">
                <p className="text-[11px] font-semibold text-white/70">참고 원전</p>
                <ul className="mt-[6px] space-y-[3px] text-[11px] text-white/50">
                  {data.sources.map((src) => (
                    <li key={src} className="leading-[16px]">
                      {src}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

      {data && data.interpretation_status === "partial" && sortedPalaces.length === 0 && (
        <section className="mt-[16px] rounded-[14px] border border-yellow-400/30 bg-yellow-500/5 p-[14px] text-center">
          <p className="text-[12px] leading-[20px] text-yellow-100/80">
            일시적으로 불러오지 못했어요.
            <br />
            잠시 후 새로고침 해주세요.
          </p>
        </section>
      )}

      {data && data.interpretation_status === "pending" && (
        <section className="mt-[20px] rounded-[14px] border border-white/15 bg-white/5 p-[16px] text-center">
          <p className="text-[13px] leading-[22px] text-white/75">
            자미두수 풀이를 만들지 못했어요. 사주 정보를 확인해주시거나 잠시 후 새로고침 해주세요.
          </p>
        </section>
      )}
    </>
  );
}

// --- 12궁 카드 ---

function PalaceCard({ palace }: { palace: DeepPalace }) {
  const appTitle = palace.app_title || PALACE_INTRO[palace.name_ko]?.app_title || "";
  const hasNewFormat = !!(palace.summary || palace.love_interpretation || palace.love_tip);

  return (
    <div className="rounded-[14px] border border-white/15 bg-white/5 p-[16px]">
      <div className="flex items-baseline gap-[8px]">
        <h4 className="text-[15px] font-bold text-white">{palace.name_ko}</h4>
        {appTitle && (
          <span className="text-[12px] text-white/50">{appTitle}</span>
        )}
      </div>

      {hasNewFormat ? (
        <div className="mt-[10px] space-y-[10px]">
          {palace.summary && (
            <p className="text-[13px] font-semibold leading-[20px] text-white/90 text-ko">
              {palace.summary}
            </p>
          )}
          {palace.love_interpretation && (
            <p className="text-[13px] leading-[20px] text-white/80 text-ko">
              {palace.love_interpretation}
            </p>
          )}
          {palace.love_tip && (
            <div className="rounded-[8px] border border-yellow-300/20 bg-yellow-300/5 px-[12px] py-[8px]">
              <p className="text-[12px] leading-[18px] text-yellow-100/90 text-ko">
                💡 {palace.love_tip}
              </p>
            </div>
          )}
          {palace.keywords.length > 0 && (
            <div className="flex flex-wrap gap-[5px]">
              {palace.keywords.map((kw) => (
                <span
                  key={kw}
                  className="rounded-full border border-white/20 bg-white/10 px-[8px] py-[3px] text-[11px] text-white/65"
                >
                  #{kw}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : palace.description ? (
        <p className="mt-[10px] text-[13px] leading-[20px] text-white/80 text-ko">
          {palace.description}
        </p>
      ) : null}
    </div>
  );
}
