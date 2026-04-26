"use client";

import { ArrowLeft, Menu, Plus, Send } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { MOCK_MATCH_CARDS } from "@/components/matching/match-card";

type Message = {
  id: string;
  from: "me" | "them";
  text: string;
};

// Seed with the conversation shown in the Figma design so the screen looks
// alive on first load. New messages get appended client-side; nothing
// is persisted yet.
const INITIAL_MESSAGES: Message[] = [
  { id: "m1", from: "them", text: "안녕하세요?" },
  { id: "m2", from: "me", text: "안녕하세요?" },
  { id: "m3", from: "them", text: "보니까 저랑 동갑이신 것 같은데" },
  { id: "m4", from: "them", text: "말부터 놓고 시작하는 걸로 할까요?" },
  { id: "m5", from: "me", text: "그럴까 그럼?" },
  { id: "m6", from: "them", text: "그래 ㅎㅎ" },
  { id: "m7", from: "them", text: "오늘은 뭐해?" },
];

export default function ChatRoomPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const candidate = MOCK_MATCH_CARDS.find((c) => c.id === params.id);

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever a message lands.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: `m${Date.now()}`, from: "me", text },
    ]);
    setInput("");
  };

  return (
    <div
      className="relative flex min-h-dvh w-full flex-1 flex-col overflow-hidden"
      style={{
        background:
          "linear-gradient(to bottom, #12081f 0%, #2a0e4f 50%, #5e35b1 100%)",
      }}
    >
      {/* Top: ZAMI logo + user icon */}
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

      {/* Sub-header: back arrow + counterpart name */}
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
          {candidate?.name ?? "채팅"}
        </h1>
        <div className="mt-[12px] h-px bg-white/30" />
      </div>

      {/* Saju-based suggestion */}
      <p className="px-[16px] pb-[10px] pt-[14px] text-center text-[12px] leading-[18px] text-[#d8c8f2]">
        Tip : 두 분은 서로 부족한 금의 기운을 채워주는 완벽한 파트너입니다.
        <br />첫 질문으로 취미에 대해 물어보는 것은 어떨까요?
      </p>

      {/* Message scroll area */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-[12px] overflow-y-auto px-[16px] pb-[24px]"
      >
        {messages.map((m) =>
          m.from === "them" ? (
            <ThemBubble
              key={m.id}
              text={m.text}
              avatar={candidate?.photo}
              name={candidate?.name}
            />
          ) : (
            <MeBubble key={m.id} text={m.text} />
          ),
        )}
      </div>

      {/* Composer */}
      <div className="px-[16px] pb-[20px] pt-[8px]">
        <div className="relative h-[55px] rounded-full bg-white/90 px-[20px]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="채팅을 입력하세요."
            className="size-full bg-transparent pr-[40px] text-[16px] font-light text-[#212265] placeholder:text-[#212265]/63 focus:outline-none"
          />
          <button
            type="button"
            onClick={send}
            disabled={!input.trim()}
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
  avatar?: string;
  name?: string;
}) {
  return (
    <div className="flex items-end gap-[8px]">
      {avatar && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt={name ?? ""}
          className="mb-[2px] size-[42px] flex-shrink-0 rounded-full border border-white/20 object-cover"
        />
      )}
      <div
        className="max-w-[70%] rounded-[10px] border border-white/5 bg-white/10 px-[14px] py-[10px] text-[14px] text-white backdrop-blur-sm"
      >
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