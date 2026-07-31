"use client";
// 앱 전역 푸시 알림 브리지 — 네이티브(Capacitor Android)에서 수신/탭 리스너를 1회 등록한다.
// 웹 환경에서는 setupPushNotificationListeners 내부에서 isNativePlatform() 체크로 조용히 스킵된다.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { setupPushNotificationListeners } from "@/lib/push";

export function PushNotificationsBridge() {
  const router = useRouter();

  useEffect(() => {
    setupPushNotificationListeners((path) => router.push(path));
  }, [router]);

  return null;
}
