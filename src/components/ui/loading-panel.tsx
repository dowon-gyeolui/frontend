"use client";

import { ProgressLoader, type ProgressMessage } from "@/components/ui/progress-loader";

/**
 * Drop-in replacement for the spinner-in-a-card pattern. Wraps
 * <ProgressLoader> in the project's standard rounded-card style so
 * call sites only need to pass `messages` + `estimatedMs` + `done`.
 */
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
  /** Optional decorative emoji above the bar. */
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