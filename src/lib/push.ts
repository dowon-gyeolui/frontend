// 푸시 알림(FCM) 등록/수신 처리 — 네이티브(Capacitor Android) 환경에서만 동작.
// 웹(PWA/데스크톱 미리보기)에서는 Capacitor.isNativePlatform() 이 false 이므로 전부 조용히 스킵된다.
import { Capacitor } from "@capacitor/core";
import {
  PushNotifications,
  type ActionPerformed,
  type PushNotificationSchema,
  type Token,
} from "@capacitor/push-notifications";

import { apiFetch } from "@/lib/api";

/**
 * 기기 토큰을 백엔드에 등록한다.
 * 계약(백엔드와 조율 필요, 미확정 시 아래 값으로 가정하고 진행):
 *   POST /users/me/device-token
 *   body: { token: string, platform: "android" | "ios" }
 *
 * 안드로이드는 FCM 등록 토큰, iOS 는 APNs 디바이스 토큰이 넘어온다(형식이 다르다).
 * 백엔드는 platform 값으로 발송 경로를 구분해야 한다.
 */
export async function registerDeviceToken(token: string): Promise<void> {
  const platform = Capacitor.getPlatform(); // "android" | "ios"
  await apiFetch("/users/me/device-token", {
    method: "POST",
    body: JSON.stringify({ token, platform }),
  });
}

let listenersReady = false;

/**
 * 앱 전역에서 한 번만 호출한다. registration/에러/수신 이벤트 리스너를 등록한다.
 * 알림 탭(pushNotificationActionPerformed) 시 채팅방으로 이동시키기 위해 router의
 * push 함수를 전달받는다.
 */
export function setupPushNotificationListeners(navigate: (path: string) => void): void {
  if (!Capacitor.isNativePlatform()) return;
  if (listenersReady) return;
  listenersReady = true;

  PushNotifications.addListener("registration", (token: Token) => {
    registerDeviceToken(token.value).catch((err) => {
      console.error("[push] 기기 토큰 백엔드 등록 실패:", err);
    });
  });

  PushNotifications.addListener("registrationError", (error) => {
    console.error("[push] 등록 실패:", error);
  });

  PushNotifications.addListener(
    "pushNotificationReceived",
    (notification: PushNotificationSchema) => {
      // 포그라운드 수신 — 재사용 가능한 토스트/배너 컴포넌트가 없어 로그만 남긴다.
      console.log("[push] 알림 수신:", notification);
    },
  );

  PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (action: ActionPerformed) => {
      const data = (action.notification.data ?? {}) as Record<string, unknown>;
      const chatRoomId = data.chat_room_id ?? data.peer_id;
      if (chatRoomId !== undefined && chatRoomId !== null && `${chatRoomId}`.trim() !== "") {
        navigate(`/matching/${chatRoomId}`);
      } else {
        // data에 채팅방/상대방 id가 없으면 채팅 목록으로 안전하게 폴백.
        navigate("/matching?tab=chat");
      }
    },
  );
}

/**
 * 로그인 성공 직후 호출한다. 권한을 요청하고, 허용되면 register() 를 호출해
 * 'registration' 이벤트로 토큰을 발급받는다(토큰 전송은 리스너에서 처리).
 */
export async function registerForPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== "granted") {
      console.log("[push] 알림 권한이 거부되었습니다.");
      return;
    }
    await PushNotifications.register();
  } catch (err) {
    console.error("[push] 알림 등록 중 오류:", err);
  }
}
