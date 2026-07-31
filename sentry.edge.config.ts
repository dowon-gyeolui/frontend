// Sentry 엣지 런타임 초기화 (middleware 등)
// SENTRY_DSN(없으면 NEXT_PUBLIC_SENTRY_DSN)이 없으면 비활성 상태로 조용히 넘어간다.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  tracesSampleRate: 1.0,
});
