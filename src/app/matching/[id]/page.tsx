"use client";

import { ArrowLeft, Menu, Plus, Send } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { ZamiLogo } from "@/components/brand/zami-logo";
import { useCallback, useEffect, useRef, useState } from "react";

import { AttachmentMenu } from "@/components/matching/attachment-menu";
import { CompatibilityReportDrawer } from "@/components/matching/compatibility-report-drawer";
import type { MatchCandidate } from "@/components/matching/match-card";
import { ReportModal } from "@/components/matching/report-modal";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  fetchMessagesWith,
  leaveChatWith,
  listThreads,
  markThreadRead,
  sendMediaMessageTo,
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
  const [reportOpen, setReportOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  // 방 나가기 확인 팝업.
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [blockOnLeave, setBlockOnLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  // Track the last seen message id for incremental polling.
  const lastIdRef = useRef<number>(0);

  // Visual viewport height — shrinks when the soft keyboard opens. We bind
  // the chat container's height to this so the message list keeps its own
  // scroll context (instead of the entire page sliding up). 미사용 시 fallback
  // 으로 100dvh.
  const [vvHeight, setVvHeight] = useState<number | null>(null);
  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;
    const update = () => setVvHeight(vv.height);
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  // Auth + load self. 채팅 권한은 "카드를 열람한 상대" 인지로 백엔드가
  // 게이팅한다(PRD 6.2) — 미열람 상대에게 전송하면 send 가 403 을 반환하고
  // 그 detail("카드를 열람한 상대와만 채팅할 수 있어요") 이 하단에 노출된다.
  useEffect(() => {
    if (!getToken()) {
      router.replace("/");
      return;
    }
    apiFetch<Me>("/users/me")
      .then(setMe)
      .catch((e: Error) => setError(e.message));
  }, [router, peerId]);

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

  // Fallback: if sessionStorage didn't carry a candidate (direct URL access
  // or arrival from the threads-tab list), resolve the peer's nickname/photo
  // by walking /chat/threads instead of showing "사용자 14".
  useEffect(() => {
    if (candidate || !me) return;
    let cancelled = false;
    listThreads()
      .then((threads) => {
        if (cancelled) return;
        const thread = threads.find((t) => t.peer.user_id === peerId);
        if (!thread) return;
        setCandidate({
          user_id: thread.peer.user_id,
          nickname: thread.peer.nickname,
          photo_url: thread.peer.photo_url,
          // Filler — only nickname/photo are read by the header.
          score: 0,
          age: null,
          gender: null,
          is_blinded: false,
          birth_year: null,
          dominant_element: null,
          mbti: null,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [candidate, me, peerId]);

  // Initial history load. Once messages arrive, fire-and-forget a
  // mark-as-read so the unread badge in /chat/threads drops to 0.
  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    fetchMessagesWith(peerId)
      .then((msgs) => {
        if (cancelled) return;
        setMessages(msgs);
        if (msgs.length > 0) lastIdRef.current = msgs[msgs.length - 1].id;
        markThreadRead(peerId).catch(() => {});
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
        let appendedFromPeer = false;
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const fresh = newer.filter((m) => !seen.has(m.id));
          if (fresh.length === 0) return prev;
          appendedFromPeer = fresh.some((m) => m.sender_id !== me.id);
          return [...prev, ...fresh];
        });
        lastIdRef.current = newer[newer.length - 1].id;
        if (appendedFromPeer) markThreadRead(peerId).catch(() => {});
      } catch {
      }
    };
    const handle = window.setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, [me, peerId]);

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
    setError(null);
    try {
      const msg = await sendMessageTo(peerId, text);
      setMessages((prev) => {
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

  const sendMedia = useCallback(
    async (file: Blob, kind: "image" | "audio") => {
      if (attachmentUploading) return;
      setAttachmentUploading(true);
      setError(null);
      try {
        const msg = await sendMediaMessageTo(peerId, file, kind);
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
        );
        lastIdRef.current = Math.max(lastIdRef.current, msg.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "미디어 전송 실패");
      } finally {
        setAttachmentUploading(false);
      }
    },
    [attachmentUploading, peerId],
  );

  const confirmLeave = useCallback(async () => {
    if (leaving) return;
    setLeaving(true);
    setLeaveError(null);
    try {
      await leaveChatWith(peerId, blockOnLeave);
      router.push("/matching?tab=chat");
    } catch (e) {
      // 실패 시 팝업을 유지하고 사유를 노출 — 차단/삭제가 안 됐을 수 있으므로
      // 자동으로 방을 떠나지 않는다.
      setLeaveError(e instanceof Error ? e.message : "방을 나가지 못했어요.");
      setLeaving(false);
    }
  }, [leaving, peerId, blockOnLeave, router]);

  const otherName = candidate?.nickname ?? `사용자 ${peerId}`;
  const otherPhoto = candidate?.photo_url ?? PLACEHOLDER_PHOTO;

  return (
    <div
      className="relative flex w-full flex-1 flex-col overflow-hidden"
      style={{
        // Lock to the visible viewport so soft-keyboard appearance shrinks the
        // chat container itself, leaving message scroll independent. Falls back
        // to 100dvh when the API isn't available (older browsers).
        height: vvHeight ?? undefined,
        minHeight: vvHeight ? undefined : "100dvh",
        background:
          "linear-gradient(to bottom, #12081f 0%, #2a0e4f 50%, #5e35b1 100%)",
      }}
    >
      {/* Top: ZAMI logo + menu */}
      <div className="relative pt-[39px]">
        <div className="flex items-center justify-between px-[24px]">
          <Link href="/home" aria-label="홈으로">
            <ZamiLogo size="sm" />
          </Link>
          <button
            type="button"
            onClick={() => setReportOpen(true)}
            aria-label="분석 리포트"
            className="grid size-[28px] place-items-center"
          >
            <Menu className="size-[22px] stroke-white stroke-[2]" />
          </button>
        </div>
        <div className="mt-[14px] h-px bg-white/40" />
      </div>

      {/* Sub-header */}
      <div className="relative pt-[14px]">
        <button
          type="button"
          onClick={() => router.push("/matching?tab=chat")}
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
        </p>
      )}

      {/* Message scroll area */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-[12px] overflow-y-auto px-[16px] pb-[24px]"
      >
        {messages.map((m) =>
          m.sender_id === me?.id ? (
            <MeBubble key={m.id} message={m} />
          ) : (
            <ThemBubble
              key={m.id}
              message={m}
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
            placeholder="채팅을 보내볼까요?."
            className="size-full bg-transparent pr-[40px] text-[16px] font-light text-[#212265] placeholder:text-[#212265]/63 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (input.trim()) send();
              else setAttachmentOpen(true);
            }}
            disabled={attachmentUploading || sending}
            aria-label={input.trim() ? "보내기" : "첨부 메뉴 열기"}
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

      {/* 운명 분석 리포트 drawer — opened by the header menu button */}
      <CompatibilityReportDrawer
        peerId={peerId}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onLeaveRoom={() => {
          setReportOpen(false);
          setBlockOnLeave(false);
          setLeaveError(null);
          setLeaveOpen(true);
        }}
        onReport={() => {
          setReportOpen(false);
          setReportModalOpen(true);
        }}
      />

      {reportModalOpen && (
        <ReportModal
          reportedUserId={peerId}
          onClose={() => setReportModalOpen(false)}
          onSubmitted={() => {
            setReportModalOpen(false);
            alert("신고가 접수되었습니다. 빠른 시일 내 답변 드리겠습니다.");
          }}
        />
      )}

      <AttachmentMenu
        open={attachmentOpen}
        onClose={() => setAttachmentOpen(false)}
        onPickFile={(file, kind) => {
          setAttachmentOpen(false);
          void sendMedia(file, kind);
        }}
      />

      {attachmentUploading && (
        <div className="fixed bottom-[90px] left-1/2 z-40 -translate-x-1/2 rounded-full bg-black/65 px-[14px] py-[6px] text-[12px] text-white">
          전송 중
        </div>
      )}

      {leaveOpen && (
        <LeaveRoomModal
          block={blockOnLeave}
          onToggleBlock={() => setBlockOnLeave((v) => !v)}
          busy={leaving}
          error={leaveError}
          onConfirm={confirmLeave}
          onCancel={() => {
            if (leaving) return;
            setLeaveOpen(false);
          }}
        />
      )}
    </div>
  );
}

function LeaveRoomModal({
  block,
  onToggleBlock,
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  block: boolean;
  onToggleBlock: () => void;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-[20px] backdrop-blur-[2px]"
      onClick={busy ? undefined : onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[320px] max-w-full rounded-[18px] border border-white/15 bg-[#241338] p-[20px] shadow-[0_10px_40px_rgba(0,0,0,0.45)]"
      >
        <h3 className="text-center text-[16px] font-bold text-white">
          채팅방을 나가시겠어요?
        </h3>

        <label className="mt-[16px] flex cursor-pointer items-start gap-[8px]">
          <input
            type="checkbox"
            checked={block}
            onChange={onToggleBlock}
            disabled={busy}
            className="mt-[2px] size-[16px] accent-[#8b5cf6]"
          />
          <span className="text-[12px] leading-[18px] text-white/80">
            상대방의 채팅방에서도 삭제할게요{" "}
            <span className="text-white/50">(차단)</span>
            <br />
            <span className="text-[11px] text-white/45">
              체크하면 두 사람 모두 이 대화를 다시 볼 수 없어요.
            </span>
          </span>
        </label>

        {error && (
          <p className="mt-[10px] text-center text-[11px] text-red-300">
            {error}
          </p>
        )}

        <div className="mt-[18px] flex gap-[10px]">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-[44px] flex-1 rounded-[12px] border border-white/15 bg-white/5 text-[14px] font-medium text-white/75 hover:bg-white/10 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="h-[44px] flex-1 rounded-[12px] bg-[rgba(255,95,95,0.95)] text-[14px] font-bold text-white hover:bg-[rgba(255,95,95,1)] disabled:opacity-50"
          >
            {busy ? "나가는 중..." : "나가기"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** ISO 8601 → "오후 1:55" (한국어 12시간제). */
function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function MediaContent({ message }: { message: Message }) {
  if (message.media_type === "image" && message.media_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={message.media_url}
        alt="첨부 이미지"
        className="block max-h-[280px] w-full rounded-[8px] object-cover"
      />
    );
  }
  if (message.media_type === "audio" && message.media_url) {
    return (
      <audio
        src={message.media_url}
        controls
        preload="metadata"
        className="w-full max-w-[260px]"
      />
    );
  }
  return null;
}

function ThemBubble({
  message,
  avatar,
  name,
}: {
  message: Message;
  avatar: string;
  name: string;
}) {
  const hasMedia = !!message.media_url;
  return (
    <div className="flex items-end gap-[8px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatar}
        alt={name}
        className="mb-[2px] size-[42px] flex-shrink-0 rounded-full border border-white/20 object-cover"
      />
      <div
        className={`max-w-[70%] rounded-[10px] border border-white/5 bg-white/10 text-[14px] text-white backdrop-blur-sm ${
          hasMedia ? "p-[6px]" : "px-[14px] py-[10px]"
        }`}
      >
        <MediaContent message={message} />
        {message.content && (
          <p className={hasMedia ? "mt-[6px] px-[8px] pb-[2px]" : ""}>
            {message.content}
          </p>
        )}
      </div>
      <span className="mb-[2px] shrink-0 text-[10px] text-white/50">
        {formatTime(message.created_at)}
      </span>
    </div>
  );
}

function MeBubble({ message }: { message: Message }) {
  const hasMedia = !!message.media_url;
  return (
    <div className="flex items-end justify-end gap-[6px]">
      <span className="mb-[2px] shrink-0 text-[10px] text-white/50">
        {formatTime(message.created_at)}
      </span>
      <div
        className={`max-w-[70%] rounded-[10px] bg-[#8b5cf6] text-[14px] text-white shadow-[0_0_4px_0_#8b5cf6] ${
          hasMedia ? "p-[6px]" : "px-[14px] py-[10px]"
        }`}
      >
        <MediaContent message={message} />
        {message.content && (
          <p className={hasMedia ? "mt-[6px] px-[8px] pb-[2px]" : ""}>
            {message.content}
          </p>
        )}
      </div>
    </div>
  );
}