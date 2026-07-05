// Capacitor 네이티브 앱 설정 — 배포된 웹(zami.vercel.app)을 로드하는 하이브리드 앱.
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.zami.app",
  appName: "ZAMI",
  webDir: "www",
  server: {
    url: "https://zami.vercel.app",
    // 카카오 OAuth 흐름(프론트 → 백엔드 → kauth.kakao.com → 백엔드 콜백 → 프론트)이
    // WebView 안에서 그대로 이어지도록 이동 허용 도메인을 지정한다.
    allowNavigation: [
      "zami.vercel.app",
      "*.vercel.app",
      "kauth.kakao.com",
      "kapi.kakao.com",
      "accounts.kakao.com",
      "*.kakao.com",
      "*.onrender.com",
    ],
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;