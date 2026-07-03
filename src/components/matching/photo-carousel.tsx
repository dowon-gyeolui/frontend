"use client";
// 사진 캐러셀 — 터치/마우스 드래그 스와이프 + 하단 점 인디케이터.

import { useRef, useState } from "react";
import type { MouseEvent, PointerEvent, ReactNode } from "react";

const FALLBACK_PHOTO =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=750&fit=crop";

const SWIPE_THRESHOLD = 40;

export function PhotoCarousel({
  photos,
  alt,
  className = "",
  imageClassName = "",
  enabled = true,
  children,
}: {
  photos: string[];
  alt: string;
  className?: string;
  imageClassName?: string;
  enabled?: boolean;
  children?: ReactNode;
}) {
  const list = photos.length > 0 ? photos : [FALLBACK_PHOTO];
  const [index, setIndex] = useState(0);
  const safe = Math.min(index, list.length - 1);
  const canSwipe = enabled && list.length > 1;

  const startX = useRef<number | null>(null);
  const draggedRef = useRef(false);

  const go = (dir: number) =>
    setIndex((i) => (i + dir + list.length) % list.length);

  const onPointerDown = (e: PointerEvent) => {
    if (!canSwipe) return;
    startX.current = e.clientX;
    draggedRef.current = false;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerUp = (e: PointerEvent) => {
    if (startX.current === null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      draggedRef.current = true;
      go(dx < 0 ? 1 : -1);
    }
  };
  const onClickCapture = (e: MouseEvent) => {
    if (draggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      draggedRef.current = false;
    }
  };

  return (
    <div
      className={`relative select-none ${className}`}
      style={{ touchAction: "pan-y" }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onClickCapture={onClickCapture}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={list[safe]}
        alt={alt}
        draggable={false}
        className={imageClassName}
      />
      {children}
      {list.length > 1 && (
        <div className="pointer-events-none absolute bottom-[10px] left-1/2 flex -translate-x-1/2 gap-[5px]">
          {list.map((_, i) => (
            <span
              key={i}
              className={`size-[6px] rounded-full transition-colors ${
                i === safe ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}