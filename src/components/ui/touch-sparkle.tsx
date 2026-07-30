"use client";
// 전역 터치 피드백 — 화면을 탭하면 누른 지점에서 별이 흩어지고,
// data-shine 이 붙은 결제/프리미엄 버튼은 빛줄기가 한 번 지나간다.

import { useEffect } from "react";

const STAR_COUNT = 10;
const TAP_MOVE_TOLERANCE_PX = 10; // 이보다 많이 움직이면 스크롤/드래그로 보고 별을 띄우지 않는다
const TAP_MAX_MS = 700;

const STAR_SVG =
  '<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" aria-hidden="true">' +
  '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></svg>';

// 입력 중 방해가 되는 곳에서는 별을 띄우지 않는다.
const SKIP_SELECTOR =
  'input, textarea, select, audio, video, [contenteditable="true"], [data-no-sparkle]';

export function TouchSparkle() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let startX = 0;
    let startY = 0;
    let startedAt = 0;
    let skip = false;

    const spawnStars = (x: number, y: number) => {
      for (let i = 0; i < STAR_COUNT; i += 1) {
        const angle = (Math.PI * 2 * i) / STAR_COUNT + Math.random() * 0.5;
        const dist = 34 + Math.random() * 30;
        const el = document.createElement("span");
        el.className = "zami-spark";
        el.innerHTML = STAR_SVG;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.setProperty("--zami-dx", `${Math.cos(angle) * dist}px`);
        el.style.setProperty("--zami-dy", `${Math.sin(angle) * dist}px`);
        el.style.animationDelay = `${Math.random() * 60}ms`;
        el.addEventListener("animationend", () => el.remove());
        document.body.appendChild(el);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      skip = !!target?.closest?.(SKIP_SELECTOR);
      startX = e.clientX;
      startY = e.clientY;
      startedAt = Date.now();

      // 결제/프리미엄 버튼: 누르는 즉시 광택이 지나간다.
      const shineHost = target?.closest?.("[data-shine]") as HTMLElement | null;
      if (shineHost) {
        const sweep = document.createElement("span");
        sweep.className = "zami-shine-sweep";
        sweep.addEventListener("animationend", () => sweep.remove());
        shineHost.appendChild(sweep);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (skip) return;
      const moved = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (moved > TAP_MOVE_TOLERANCE_PX) return; // 스크롤/스와이프는 제외
      if (Date.now() - startedAt > TAP_MAX_MS) return; // 길게 누르기는 제외
      spawnStars(e.clientX, e.clientY);
    };

    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      document.querySelectorAll(".zami-spark").forEach((n) => n.remove());
    };
  }, []);

  return null;
}
