import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  // SENTRY_AUTH_TOKEN이 없으면 소스맵 업로드 없이 빌드만 계속 진행된다.
  silent: true,
});
