"use client";

import { ArrowLeft, Save } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Me = {
  nickname: string | null;
  bio: string | null;
  height_cm: number | null;
  mbti: string | null;
  job: string | null;
  region: string | null;
  smoking: string | null;
  drinking: string | null;
  religion: string | null;
};

type FormState = {
  nickname: string;
  bio: string;
  height_cm: string; // text input — converted on submit
  mbti: string;
  job: string;
  region: string;
  smoking: string;
  drinking: string;
  religion: string;
};

const SMOKING_OPTIONS = ["", "안함", "전자담배", "흡연"];
const DRINKING_OPTIONS = ["", "안함", "가끔", "자주"];
const RELIGION_OPTIONS = ["", "무교", "기독교", "불교", "천주교", "기타"];

function emptyForm(): FormState {
  return {
    nickname: "",
    bio: "",
    height_cm: "",
    mbti: "",
    job: "",
    region: "",
    smoking: "",
    drinking: "",
    religion: "",
  };
}

function MypageEditContent() {
  const router = useRouter();
  const params = useSearchParams();
  const focus = params.get("focus"); // "bio" | "basic" | null

  const [form, setForm] = useState<FormState>(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bioRef = useRef<HTMLTextAreaElement>(null);
  const basicRef = useRef<HTMLDivElement>(null);

  // Load current values
  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    apiFetch<Me>("/users/me")
      .then((me) => {
        setForm({
          nickname: me.nickname ?? "",
          bio: me.bio ?? "",
          height_cm: me.height_cm !== null ? String(me.height_cm) : "",
          mbti: me.mbti ?? "",
          job: me.job ?? "",
          region: me.region ?? "",
          smoking: me.smoking ?? "",
          drinking: me.drinking ?? "",
          religion: me.religion ?? "",
        });
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, [router]);

  // Auto-scroll/focus to the requested section
  useEffect(() => {
    if (loading) return;
    if (focus === "bio") {
      bioRef.current?.focus();
    } else if (focus === "basic") {
      basicRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, focus]);

  const update = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const submit = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    // Build a payload with only non-empty fields. Empty string → omit so the
    // backend keeps the previous value. height_cm needs a number cast.
    const payload: Record<string, unknown> = {};
    if (form.nickname.trim()) payload.nickname = form.nickname.trim();
    payload.bio = form.bio; // allow blank to clear
    if (form.height_cm.trim()) {
      const n = Number(form.height_cm);
      if (!Number.isFinite(n) || n < 100 || n > 250) {
        setError("키는 100~250 사이 숫자로 입력해주세요");
        setSaving(false);
        return;
      }
      payload.height_cm = n;
    }
    if (form.mbti.trim()) payload.mbti = form.mbti.trim().toUpperCase();
    if (form.job.trim()) payload.job = form.job.trim();
    if (form.region.trim()) payload.region = form.region.trim();
    if (form.smoking) payload.smoking = form.smoking;
    if (form.drinking) payload.drinking = form.drinking;
    if (form.religion) payload.religion = form.religion;

    try {
      await apiFetch("/users/me/profile", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      router.push("/mypage");
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="flex-1 px-[20px] pb-[40px]">
        {/* Sub-header */}
        <div className="relative pt-[14px]">
          <button
            type="button"
            onClick={() => router.push("/mypage")}
            aria-label="뒤로"
            className="absolute left-0 top-[14px]"
          >
            <ArrowLeft className="size-[24px] stroke-white stroke-[2]" />
          </button>
          <h1 className="text-center text-[20px] font-bold text-white">
            프로필 편집
          </h1>
          <div className="mt-[10px] h-px bg-white/30" />
        </div>

        {loading && (
          <div className="flex justify-center pt-[60px]">
            <div className="size-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          </div>
        )}

        {!loading && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="mt-[20px] space-y-[24px]"
          >
            {/* 한 줄 자기소개 */}
            <section>
              <label className="text-[14px] font-semibold text-white">
                한 줄 자기소개{" "}
                <span className="text-[11px] text-white/40">
                  ({form.bio.length}/120)
                </span>
              </label>
              <textarea
                ref={bioRef}
                value={form.bio}
                maxLength={120}
                onChange={(e) => update({ bio: e.target.value })}
                placeholder="안정적인 사람을 만나서 오래도록 연애하고 싶어요!"
                rows={2}
                className="mt-[8px] w-full resize-none rounded-[12px] border border-white/15 bg-white/10 p-[12px] text-[14px] text-white placeholder:text-white/40 focus:border-purple-300 focus:outline-none"
              />
            </section>

            {/* 기본 정보 */}
            <section ref={basicRef} className="space-y-[14px]">
              <h2 className="text-[14px] font-semibold text-white">기본 정보</h2>

              <Field label="이름 (닉네임)">
                <input
                  type="text"
                  value={form.nickname}
                  onChange={(e) => update({ nickname: e.target.value })}
                  maxLength={50}
                  className="input"
                />
              </Field>

              <Field label="키 (cm)">
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.height_cm}
                  onChange={(e) => update({ height_cm: e.target.value })}
                  min={100}
                  max={250}
                  placeholder="예: 168"
                  className="input"
                />
              </Field>

              <Field label="MBTI">
                <input
                  type="text"
                  value={form.mbti}
                  onChange={(e) => update({ mbti: e.target.value.toUpperCase() })}
                  maxLength={4}
                  placeholder="예: INFP"
                  className="input uppercase tracking-widest"
                />
              </Field>

              <Field label="직업">
                <input
                  type="text"
                  value={form.job}
                  onChange={(e) => update({ job: e.target.value })}
                  maxLength={50}
                  placeholder="예: 디자이너"
                  className="input"
                />
              </Field>

              <Field label="거주지">
                <input
                  type="text"
                  value={form.region}
                  onChange={(e) => update({ region: e.target.value })}
                  maxLength={50}
                  placeholder="예: 서울"
                  className="input"
                />
              </Field>

              <Field label="흡연">
                <Select
                  value={form.smoking}
                  onChange={(v) => update({ smoking: v })}
                  options={SMOKING_OPTIONS}
                />
              </Field>

              <Field label="음주">
                <Select
                  value={form.drinking}
                  onChange={(v) => update({ drinking: v })}
                  options={DRINKING_OPTIONS}
                />
              </Field>

              <Field label="종교">
                <Select
                  value={form.religion}
                  onChange={(v) => update({ religion: v })}
                  options={RELIGION_OPTIONS}
                />
              </Field>
            </section>

            {error && (
              <p className="text-center text-[12px] text-red-300">{error}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[12px] text-[16px] font-bold text-white shadow-[0_0_15px_-2px_rgba(168,85,247,0.5)] disabled:opacity-50"
              style={{
                backgroundImage:
                  "linear-gradient(99deg, rgb(124, 58, 237) 0%, rgb(168, 85, 247) 100%)",
              }}
            >
              <Save className="size-[18px]" />
              {saving ? "저장 중..." : "저장하기"}
            </button>
          </form>
        )}
      </div>

      {/* Tailwind doesn't auto-pick custom utility names; use globals via style instead.
          Apply input styles via a <style jsx global> below for a single-source set. */}
      <style>{`
        .input {
          height: 44px;
          width: 100%;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.15);
          background-color: rgba(255,255,255,0.10);
          padding: 0 12px;
          font-size: 14px;
          color: #fff;
        }
        .input:focus {
          outline: none;
          border-color: #c4b5fd;
        }
        .input::placeholder { color: rgba(255,255,255,0.4); }
      `}</style>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[12px] text-white/70">{label}</span>
      <div className="mt-[6px]">{children}</div>
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input"
    >
      {options.map((opt) => (
        <option key={opt} value={opt} className="bg-[#1b0e2e] text-white">
          {opt === "" ? "선택 안 함" : opt}
        </option>
      ))}
    </select>
  );
}

export default function MypageEditPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="flex flex-1 items-center justify-center">
            <p className="text-white/60">로딩 중...</p>
          </div>
        </AppShell>
      }
    >
      <MypageEditContent />
    </Suspense>
  );
}