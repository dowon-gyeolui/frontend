"use client";
// 온보딩 연애 인터뷰(/onboarding/interview) — 선택형 질문에 답변하는 페이지

import { useRouter } from "next/navigation";
import { useState } from "react";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { INTERVIEW_CATEGORIES } from "@/lib/interview";
import { useOnboarding } from "@/lib/onboarding-context";

const MAX_ANSWER_LEN = 200;

export default function OnboardingInterviewPage() {
  const router = useRouter();
  const { state, update } = useOnboarding();

  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const a of state.interview ?? []) init[a.question_key] = a.answer;
    return init;
  });
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set((state.interview ?? []).map((a) => a.question_key)),
  );
  const [open, setOpen] = useState<Set<string>>(new Set());

  const toggleCategory = (name: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  const toggleQuestion = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        setAnswers((a) => {
          const copy = { ...a };
          delete copy[key];
          return copy;
        });
      } else {
        next.add(key);
      }
      return next;
    });

  const answeredCount = [...selected].filter(
    (k) => (answers[k] ?? "").trim().length > 0,
  ).length;

  const onNext = () => {
    const list = [...selected]
      .map((k) => ({ question_key: k, answer: (answers[k] ?? "").trim() }))
      .filter((a) => a.answer.length > 0);
    update({ interview: list });
    router.push("/onboarding/done");
  };

  return (
    <OnboardingShell step={6}>
      <div className="flex flex-1 flex-col px-[24px] pb-[40px]">
        <div className="flex flex-1 flex-col gap-[16px] pt-[28px]">
          <div className="flex flex-col gap-[8px]">
            <h1 className="text-center text-[22px] font-bold tracking-tight text-white">
              연애 인터뷰
            </h1>
            <p className="text-center text-[13px] leading-[19px] text-white/60">
              답하고 싶은 질문만 골라 답해주세요.
              <br />
              내가 답한 개수만큼 상대의 답변도 볼 수 있어요. (선택, 건너뛰기 가능)
            </p>
          </div>

          <div className="space-y-[10px]">
            {INTERVIEW_CATEGORIES.map((cat) => {
              const isOpen = open.has(cat.category);
              const picked = cat.questions.filter((q) =>
                selected.has(q.key),
              ).length;
              return (
                <div
                  key={cat.category}
                  className="overflow-hidden rounded-[14px] border border-white/15 bg-white/5"
                >
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.category)}
                    className="flex w-full items-center justify-between px-[16px] py-[13px] text-left"
                  >
                    <span className="text-[15px] font-semibold text-white">
                      {cat.category}
                      {picked > 0 && (
                        <span className="ml-[6px] text-[12px] font-medium text-[#fde047]">
                          {picked}
                        </span>
                      )}
                    </span>
                    <span className="text-[14px] text-white/50">
                      {isOpen ? "▲" : "▼"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="space-y-[10px] border-t border-white/10 px-[16px] py-[12px]">
                      {cat.questions.map((q) => {
                        const checked = selected.has(q.key);
                        return (
                          <div key={q.key}>
                            <label className="flex cursor-pointer items-start gap-[8px]">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleQuestion(q.key)}
                                className="mt-[2px] size-[16px] shrink-0 accent-[#a855f7]"
                              />
                              <span className="text-[13px] leading-[19px] text-white/85">
                                {q.text}
                              </span>
                            </label>
                            {checked && (
                              <textarea
                                value={answers[q.key] ?? ""}
                                onChange={(e) =>
                                  setAnswers((a) => ({
                                    ...a,
                                    [q.key]: e.target.value,
                                  }))
                                }
                                maxLength={MAX_ANSWER_LEN}
                                rows={2}
                                placeholder="답변을 입력해주세요."
                                className="mt-[8px] w-full resize-none rounded-[10px] border border-white/20 bg-white/10 px-[12px] py-[8px] text-[13px] text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#a855f7]"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-center text-[12px] text-white/50">
            {answeredCount > 0
              ? `${answeredCount}개 답변 작성됨`
              : "아직 답한 질문이 없어요"}
          </p>
        </div>

        <div className="mt-[24px] flex gap-[10px]">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-[52px] flex-1 rounded-[5px] border border-white/20 text-[18px] font-semibold text-white shadow-[0px_0px_15px_0px_rgba(139,92,246,0.35)]"
            style={{
              backgroundImage:
                "linear-gradient(108deg, rgb(168, 85, 247) 0%, rgb(124, 58, 237) 100%)",
            }}
          >
            이전
          </button>
          <button
            type="button"
            onClick={onNext}
            className="h-[52px] flex-1 rounded-[5px] bg-[#6366f1] text-[18px] font-semibold text-white shadow-[0px_4px_15px_-2px_rgba(99,102,241,0.5)] hover:opacity-90"
          >
            {answeredCount > 0 ? "다음" : "건너뛰기"}
          </button>
        </div>
      </div>
    </OnboardingShell>
  );
}
