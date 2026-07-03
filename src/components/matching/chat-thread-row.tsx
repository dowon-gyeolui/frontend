"use client";
// 채팅 탭의 스와이프 가능한 대화방 행 — 좌로 드래그하면 나가기 버튼 노출.

import { Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { ChatThreadSummary } from "@/lib/chat";

const PLACEHOLDER_PHOTO =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop";

const ACTION_WIDTH = 88;
const SWIPE_THRESHOLD = 36;

export function ChatThreadRow({
  thread,
  isOpen,
  onOpenChange,
  onClick,
  onLeave,
}: {
  thread: ChatThreadSummary;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClick: () => void;
  onLeave: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTranslate = useRef(0);
  const dragging = useRef(false);
  const swiping = useRef(false);
  const [translateX, setTranslateX] = useState(isOpen ? -ACTION_WIDTH : 0);

  useEffect(() => {
    if (!dragging.current) {
      setTranslateX(isOpen ? -ACTION_WIDTH : 0);
    }
  }, [isOpen]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-row-action]")) return;

    dragging.current = true;
    swiping.current = false;
    startX.current = e.clientX;
    startY.current = e.clientY;
    startTranslate.current = translateX;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (!swiping.current) {
      if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
        dragging.current = false;
        return;
      }
      if (Math.abs(dx) < 6) return;
      swiping.current = true;
    }

    const next = Math.min(8, Math.max(-ACTION_WIDTH - 16, startTranslate.current + dx));
    setTranslateX(next);
  };

  const finishDrag = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (!swiping.current) return;
    swiping.current = false;

    const wasOpen = startTranslate.current <= -ACTION_WIDTH / 2;
    const nowPast = translateX <= -SWIPE_THRESHOLD;
    const shouldOpen = wasOpen ? translateX <= -SWIPE_THRESHOLD : nowPast;

    if (shouldOpen) {
      setTranslateX(-ACTION_WIDTH);
      onOpenChange(true);
    } else {
      setTranslateX(0);
      onOpenChange(false);
    }
  };

  const onPointerUp = () => finishDrag();
  const onPointerCancel = () => finishDrag();

  const handleRowClick = () => {
    if (translateX !== 0 || swiping.current) {
      setTranslateX(0);
      onOpenChange(false);
      return;
    }
    onClick();
  };

  const peerName = thread.peer.nickname ?? "익명";
  const lastText = thread.last_message?.content ?? "대화를 시작해보세요";
  const photo = thread.peer.photo_url ?? PLACEHOLDER_PHOTO;

  return (
    <div ref={containerRef} className="relative h-[86px] w-full overflow-hidden rounded-[10px]">
      <button
        type="button"
        data-row-action
        onClick={onLeave}
        aria-label="채팅방 나가기"
        className="absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-[4px] bg-red-500 text-white"
        style={{ width: `${ACTION_WIDTH}px` }}
      >
        <Trash2 className="size-[20px]" />
        <span className="text-[12px] font-semibold">나가기</span>
      </button>

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClick={handleRowClick}
        role="button"
        tabIndex={0}
        className="relative h-full w-full cursor-pointer touch-pan-y select-none rounded-[10px] text-left shadow-[0px_4px_15px_-4px_rgba(168,85,247,0.4)] transition active:scale-[0.99]"
        style={{
          backgroundImage:
            "linear-gradient(96deg, rgb(124, 58, 237) 0%, rgb(168, 85, 247) 100%)",
          transform: `translateX(${translateX}px)`,
          transition: dragging.current ? "none" : "transform 0.22s ease",
        }}
      >
        <div className="flex h-full items-center gap-[12px] px-[14px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt={peerName}
            className="size-[58px] flex-shrink-0 rounded-full border border-white/20 object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[20px] font-bold text-white">{peerName}</p>
            <p className="truncate text-[15px] text-white/95">{lastText}</p>
          </div>
          {thread.unread_count > 0 && (
            <span className="flex-shrink-0 rounded-full bg-[#ff5f5f] px-[8px] py-[2px] text-[12px] font-bold text-white shadow-[0_0_8px_-1px_rgba(255,95,95,0.7)]">
              {thread.unread_count > 99 ? "99+" : thread.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}