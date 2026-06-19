"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { INTERVIEW_CATEGORIES } from "@/lib/interview";

const MAX_ANSWER_LEN = 200;

type Answer = { question_key: string; answer: string };

/**
 * 내 연애 인터뷰 작성/수정 모달 — 매칭 정보 팝업의
 * "나를 보여주는 연애 프로필 질문" CTA 에서 연다.
 *
 * 카테고리를 펼쳐 답하고 싶은 질문만 체크해 답한다. 기존 답변은 GET 으로
 * prefill, 저장 시 PUT /users/me/interview 로 전체 교체한다. 내가 답한
 * 개수만큼 상대 답변도 열린다(상호주의).
 */
export function InterviewSelfEditModal({ onClose }: { onClose: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Answer[]>("/users/me/interview")
      .then((rows) => {
        const a: Record<string, string> = {};
        const s = new Set<string>();
        for (const r of rows) {
          a[r.question_key] = r.answer;
          s.add(r.question_key);
        }
        setAnswers(a);
        setSelected(s);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    const list = [...selected]
      .map((k) => ({ question_key: k, answer: (answers[k] ?? "").trim() }))
      .filter((a) => a.answer.length > 0);
    try {
      await apiFetch("/users/me/interview", {
        method: "PUT",
        body: JSON.stringify({ answers: list }),
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했어요.");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-[20px] backdrop-blur-[2px]"
      onClick={() => (saving ? null : onClose())}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[85vh] w-[360px] max-w-full flex-col rounded-[18px] border border-white/15 bg-[#241338] shadow-[0_10px_40px_rgba(0,0,0,0.45)]"
      >
        {/* Header */}
        <div className="relative px-[20px] pt-[18px]">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="닫기"
            className="absolute right-[12px] top-[16px] grid size-[24px] place-items-center disabled:opacity-40"
          >
            <X className="size-[20px] stroke-white stroke-[2]" />
          </button>
          <h3 className="text-center text-[17px] font-bold text-white">
            나를 보여주는 연애 프로필 질문
          </h3>
          <p className="mt-[6px] text-center text-[12px] leading-[18px] text-white/60">
            답하고 싶은 질문만 골라 답해주세요.
            <br />
            내가 답한 개수만큼 상대의 답변도 볼 수 있어요.
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-[20px] py-[14px]">
          {loading ? (
            <p className="py-[30px] text-center text-[13px] text-white/50">
              불러오는 중...
            </p>
          ) : (
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
          )}
        </div>

        {/* Footer */}
        <div className="px-[20px] pb-[18px] pt-[10px]">
          {error && (
            <p className="mb-[8px] text-center text-[11px] text-red-300">{error}</p>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving || loading}
            className="h-[46px] w-full rounded-[12px] text-[15px] font-bold text-white shadow-[0_0_8px_2px_#7f55b4] disabled:opacity-50"
            style={{
              backgroundImage:
                "linear-gradient(97deg, rgb(124, 58, 237) 0%, rgb(168, 85, 247) 100%)",
            }}
          >
            {saving ? "저장 중..." : `저장하기 (${answeredCount}개 답변)`}
          </button>
        </div>
      </div>
    </div>
  );
}
