"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";

/**
 * 자기소개 modal — Figma node 34:595.
 *
 * Glass-card overlay sized 341×~294px (rounded 18, white/0.7 + blur-25)
 * with a single textarea, a tip line, and a gradient 저장하기 button.
 */
export function BioEditModal({
  initialBio,
  onClose,
  onSaved,
}: {
  initialBio: string;
  onClose: () => void;
  onSaved: (bio: string) => void;
}) {
  const [bio, setBio] = useState(initialBio);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/users/me/profile", {
        method: "PATCH",
        body: JSON.stringify({ bio }),
      });
      onSaved(bio);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(27,16,41,0.4)] backdrop-blur-[2px] p-[20px]"
      onClick={() => (saving ? null : onClose())}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-[341px] max-w-full rounded-[18px] border border-white/20 bg-white/70 p-[24px] backdrop-blur-[25px] shadow-[0_10px_40px_rgba(0,0,0,0.3)]"
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-[14px] top-[14px] grid size-[24px] place-items-center"
          disabled={saving}
        >
          <X className="size-[20px] stroke-[#1b1029] stroke-[2]" />
        </button>

        {/* Title */}
        <h2 className="text-center text-[20px] font-bold tracking-[-0.6px] text-[#1b1029]">
          자기소개
        </h2>

        {/* Textarea pill */}
        <div className="mt-[20px] rounded-[12px] border border-white/20 bg-white/60 p-[14px] backdrop-blur-[5px]">
          <textarea
            autoFocus
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={100}
            rows={3}
            placeholder="자기소개를 입력해주세요."
            className="w-full resize-none bg-transparent text-center text-[16px] font-medium leading-[24px] text-[#1b1029] placeholder:text-[#1b1029]/60 focus:outline-none"
          />
          <p className="mt-[2px] text-right text-[10px] text-[#5a3a82]/70">
            {bio.length}/100
          </p>
        </div>

        {/* Tip */}
        <p className="mt-[14px] whitespace-pre-line text-center text-[10px] leading-[14px] text-[#5a3a82] text-ko">
          {`Tip : "솔직함은 좋은 운명의 상대를 불러옵니다."`}
        </p>

        {error && (
          <p className="mt-[10px] text-center text-[11px] text-red-500">{error}</p>
        )}

        {/* Save button */}
        <div className="mt-[18px] flex justify-center">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="grid h-[34px] w-[160px] place-items-center rounded-[18px] text-[16px] font-semibold text-white shadow-[0_0_8px_2px_#7f55b4] disabled:opacity-50"
            style={{
              backgroundImage:
                "linear-gradient(97deg, rgb(124, 58, 237) 0%, rgb(168, 85, 247) 100%)",
            }}
          >
            {saving ? "저장 중..." : "저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}