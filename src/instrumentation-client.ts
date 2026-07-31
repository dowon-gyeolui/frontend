// Sentry 클라이언트(브라우저) 초기화
// NEXT_PUBLIC_SENTRY_DSN이 없으면 비활성 상태로 조용히 넘어간다 (로컬 개발 시 에러 없음).
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: 1.0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
