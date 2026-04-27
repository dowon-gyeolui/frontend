"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Backwards-compat redirect — the deep saju interpretation now lives inline
 * on /saju, so any old bookmark or link that points here just lands on the
 * canonical page.
 */
export default function SajuDetailRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/saju");
  }, [router]);
  return null;
}