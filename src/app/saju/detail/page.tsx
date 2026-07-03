"use client";
// 구 사주 상세 경로 리다이렉트 (/saju/detail) — /saju 로 이동만 수행

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SajuDetailRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/saju");
  }, [router]);
  return null;
}