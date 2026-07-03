"use client";
// 역할 설명: ProgressLoader를 카드 스타일로 감싼 로딩 패널 컴포넌트

import { ProgressLoader, type ProgressMessage } from "@/components/ui/progress-loader";

export function LoadingPanel({
  estimatedMs,
  done,
  messages,
  emoji,
  className,
}: {
  estimatedMs: number;
  done?: boolean;
  messages: ProgressMessage[];
  emoji?: string;
  className?: string;
}) {
  return (
    <section
      className={
        "rounded-[14px] border border-white/15 bg-white/5 p-[20px] text-center backdrop-blur-sm " +
        (className ?? "")
      }
    >
      {emoji && <div className="mb-[10px] text-[30px]">{emoji}</div>}
      <ProgressLoader
        estimatedMs={estimatedMs}
        done={done}
        messages={messages}
      />
    </section>
  );
}