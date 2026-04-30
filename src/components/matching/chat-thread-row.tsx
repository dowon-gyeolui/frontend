"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { ChatThreadSummary } from "@/lib/chat";

const PLACEHOLDER_PHOTO =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop";

const ACTION_WIDTH = 88; // px — width of the revealed "나가기" button
const SWIPE_THRESHOLD = 36; // px the user must drag before snapping open

/**
 * One swipeable row in the chat tab.
 *
 * Drag left to reveal a "나가기" button (KakaoTalk-style). Tap the row
 * body to navigate into the chat room. An unread badge appears in the
 * top-right corner of the row when `unread_count > 0`.
 *
 * Single-row "open" state is managed by the parent: it passes `isOpen`
 * + `onOpenChange` so opening one row auto-closes any other.
 */
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
  // True once the user moves enough to count as a horizontal swipe. Until
  // then, taps still trigger onClick (we don't suppress vertical scrolls
  // either — a downward scroll cancels the swipe altogether).
  const swiping = useRef(false);
  const [translateX, setTranslateX] = useState(isOpen ? -ACTION_WIDTH : 0);

  // Sync translate when parent toggles isOpen (e.g. another row opens).
  useEffect(() => {
    if (!dragging.current) {
      setTranslateX(isOpen ? -ACTION_WIDTH : 0);
    }
  }, [isOpen]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Don't start a swipe from the action button itself — that should
    // just receive the click and trigger onLeave.
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
      /* pointer capture is best-effort */
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    // Decide swipe vs scroll on the first meaningful motion. If the
    // user is clearly dragging vertically, abort so the page can scroll.
    if (!swiping.current) {
      if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) {
        dragging.current = false;
        return;
      }
      if (Math.abs(dx) < 6) return; // not yet enough to commit either way
      swiping.current = true;
    }

    // Clamp so the row only opens leftward (negative translate). A small
    // rightward drag past 0 is allowed for finger overshoot but snaps back.
    const next = Math.min(8, Math.max(-ACTION_WIDTH - 16, startTranslate.current + dx));
    setTranslateX(next);
  };

  const finishDrag = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (!swiping.current) return; // it was a tap, no snap needed
    swiping.current = false;

    // Snap based on where the row ended up + which way the user was
    // moving. If past threshold leftward → open; otherwise → closed.
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
    // If a swipe just happened (or the row is open), the click should
    // close instead of navigate. Otherwise, navigate.
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
      {/* Behind: leave action — revealed when the foreground translates left. */}
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

      {/* Foreground: the row content. Drag left to expose the button. */}
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