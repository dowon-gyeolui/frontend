"use client";

import { ArrowLeft, Menu, Plus, Send } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import type { MatchCandidate } from "@/components/matching/match-card";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  fetchMessagesWith,
  sendMessageTo,
  type Message,
} from "@/lib/chat";

const POLL_INTERVAL_MS = 2500;

const PLACEHOLDER_PHOTO =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop";

type Me = { id: number };

export default function ChatRoomPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const peerId = Number(params.id);

  const [me, setMe] = useState<Me | null>(null);
  const [candidate, setCandidate] = useState<MatchCandidate | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  // Track the last seen message id for incremental polling.
  const lastIdRef = useRef<number>(0);

  // Auth + load self
  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    apiFetch<Me>("/users/me")
      .then(setMe)
      .catch((e: Error) => setError(e.message));
  }, [router]);

  // Adopt candidate handed down from the matching page.
  useEffect(() => {
    const raw = sessionStorage.getItem("activeChat");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as MatchCandidate;
      if (parsed.user_id === peerId) setCandidate(parsed);
    } catch {
      /* ignore */
    }
  }, [peerId]);

  // Initial history load.
  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    fetchMessagesWith(peerId)
      .then((msgs) => {
        if (cancelled) return;
        setMessages(msgs);
        if (msgs.length > 0) lastIdRef.current = msgs[msgs.length - 1].id;
      })
      .catch((e: Error) => setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [me, peerId]);

  // Polling for new messages every POLL_INTERVAL_MS.
  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const newer = await fetchMessagesWith(peerId, lastIdRef.current || undefined);
        if (cancelled || newer.length === 0) return;
        setMessages((prev) => [...prev, ...newer]);
        lastIdRef.current = newer[newer.length - 1].id;
      } catch {
        // soft-fail polls; user can retry by interacting
      }
    };
    const handle = window.setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, [me, peerId]);

  // Auto-scroll to bottom when messages change.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const msg = await sendMessageTo(peerId, text);
      setMessages((prev) => {
        // Skip if polling already grabbed it (defensive against duplicates).
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      lastIdRef.current = Math.max(lastIdRef.current, msg.id);
      setInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "전송 실패");
    } finally {
      setSending(false);
    }
  }, [input, peerId, sending]);

  const otherName = candidate?.nickname ?? `사용자 ${peerId}`;
  const otherPhoto = candidate?.photo_url ?? PLACEHOLDER_PHOTO;

  return (
    <div
      className="relative flex min-h-dvh w-full flex-1 flex-col overflow-hidden"
      style={{
        background:
          "linear-gradient(to bottom, #12081f 0%, #2a0e4f 50%, #5e35b1 100%)",
      }}
    >
      {/* Top: ZAMI logo + menu */}
      <div className="relative pt-[39px]">
        <div className="flex items-center justify-between px-[24px]">
          <span
            className="text-[18px] font-bold text-white"
            style={{ letterSpacing: "0.4em" }}
          >
            ZAMI
          </span>
          <Menu className="size-[22px] stroke-white stroke-[2]" />
        </div>
        <div className="mt-[14px] h-px bg-white/40" />
      </div>

      {/* Sub-header */}
      <div className="relative pt-[14px]">
        <button
          type="button"
          onClick={() => router.push("/matching")}
          aria-label="뒤로"
          className="absolute left-[16px] top-[14px]"
        >
          <ArrowLeft className="size-[24px] stroke-white stroke-[2]" />
        </button>
        <h1 className="text-center text-[20px] font-medium text-white">
          {otherName}
        </h1>
        <div className="mt-[12px] h-px bg-white/30" />
      </div>

      {/* Saju-based suggestion */}
      {candidate && (
        <p className="px-[16px] pb-[10px] pt-[14px] text-center text-[12px] leading-[18px] text-[#d8c8f2]">
          Tip : 사주 궁합 점수{" "}
          <span className="font-semibold text-[#fde047]">{candidate.score}%</span>
          {candidate.dominant_element && (
            <>
              · 상대의 주요 오행은{" "}
              <span className="font-semibold">{candidate.dominant_element}</span>
            </>
          )}
          .
          <br />첫 질문으로 취미에 대해 물어보는 것은 어떨까요?
        </p>
      )}

      {/* Message scroll area */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-[12px] overflow-y-auto px-[16px] pb-[24px]"
      >
        {messages.length === 0 && (
          <p className="mt-12 text-center text-[12px] text-white/40">
            첫 메시지를 보내보세요!
          </p>
        )}
        {messages.map((m) =>
          m.sender_id === me?.id ? (
            <MeBubble key={m.id} text={m.content} />
          ) : (
            <ThemBubble
              key={m.id}
              text={m.content}
              avatar={otherPhoto}
              name={otherName}
            />
          ),
        )}
      </div>

      {error && (
        <p className="px-4 pb-1 text-center text-[11px] text-red-300">{error}</p>
      )}

      {/* Composer */}
      <div className="px-[16px] pb-[20px] pt-[8px]">
        <div className="relative h-[55px] rounded-full bg-white/90 px-[20px]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={sending}
            placeholder="채팅을 입력하세요."
            className="size-full bg-transparent pr-[40px] text-[16px] font-light text-[#212265] placeholder:text-[#212265]/63 focus:outline-none"
          />
          <button
            type="button"
            onClick={send}
            disabled={!input.trim() || sending}
            aria-label="보내기"
            className="absolute right-[10px] top-1/2 grid size-[40px] -translate-y-1/2 place-items-center rounded-full bg-[#8b5cf6] text-white shadow-[0_0_10px_-2px_rgba(139,92,246,0.6)] transition disabled:bg-[#8b5cf6]/40"
          >
            {input.trim() ? (
              <Send className="size-[20px]" />
            ) : (
              <Plus className="size-[24px]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ThemBubble({
  text,
  avatar,
  name,
}: {
  text: string;
  avatar: string;
  name: string;
}) {
  return (
    <div className="flex items-end gap-[8px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatar}
        alt={name}
        className="mb-[2px] size-[42px] flex-shrink-0 rounded-full border border-white/20 object-cover"
      />
      <div className="max-w-[70%] rounded-[10px] border border-white/5 bg-white/10 px-[14px] py-[10px] text-[14px] text-white backdrop-blur-sm">
        {text}
      </div>
    </div>
  );
}

function MeBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[70%] rounded-[10px] bg-[#8b5cf6] px-[14px] py-[10px] text-[14px] text-white shadow-[0_0_4px_0_#8b5cf6]">
        {text}
      </div>
    </div>
  );
}