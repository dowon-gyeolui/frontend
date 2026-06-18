"use client";

import { Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * 채팅 + 버튼 메뉴 — 음성 메시지.
 *
 * 부모(ChatRoomPage)는 Blob 만 받아 sendMediaMessageTo 로 업로드한다.
 * 음성은 MediaRecorder API 로 최대 30초 녹음 후, 본인이 미리듣기로
 * 확인하고 "전송" 을 눌렀을 때만 Blob 으로 emit 한다.
 */

// 최대 녹음 길이(초).
const MAX_RECORD_SECONDS = 30;

// 녹음 완료본 — Blob, 미리듣기용 object URL, 길이(초).
type RecordedClip = { blob: Blob; url: string; seconds: number };

const fmtTime = (s: number) =>
  `${Math.floor(s / 60)
    .toString()
    .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

export function AttachmentMenu({
  open,
  onClose,
  onPickFile,
}: {
  open: boolean;
  onClose: () => void;
  onPickFile: (file: Blob, kind: "image" | "audio") => void;
}) {
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // 녹음 완료본 — 미리듣기 후 전송이 확정되기 전까지 보관한다.
  const [recorded, setRecorded] = useState<RecordedClip | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startTimeRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);

  // ESC closes the menu (when not actively recording)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !recording) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, recording]);

  // 메뉴가 닫히면 미리듣기 상태/에러를 초기화하고 object URL 을 해제한다.
  useEffect(() => {
    if (open) return;
    setError(null);
    setRecorded((r: RecordedClip | null) => {
      if (r?.url) URL.revokeObjectURL(r.url);
      return null;
    });
  }, [open]);

  const clearTick = () => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const stopAllTracks = () => {
    const recorder = recorderRef.current;
    if (recorder?.stream) {
      recorder.stream.getTracks().forEach((t) => t.stop());
    }
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        // codecs 파라미터(예: ;codecs=opus)는 서버 허용목록과 맞지 않으므로
        // 베이스 MIME(audio/webm 등)만 남겨 Blob 을 만든다.
        const baseMime = (recorder.mimeType || "audio/webm")
          .split(";")[0]
          .trim();
        const blob = new Blob(chunksRef.current, { type: baseMime });
        const seconds = Math.min(
          MAX_RECORD_SECONDS,
          Math.round((Date.now() - startTimeRef.current) / 1000),
        );
        stopAllTracks();
        clearTick();
        setRecording(false);
        if (blob.size > 0) {
          setRecorded({ blob, url: URL.createObjectURL(blob), seconds });
        }
      };
      recorder.start();
      startTimeRef.current = Date.now();
      setRecording(true);
      setRecordSeconds(0);
      tickRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordSeconds(elapsed);
        // 최대 길이 도달 시 자동 정지 → 미리듣기 단계로.
        if (elapsed >= MAX_RECORD_SECONDS) stopRecording();
      }, 250);
    } catch (e) {
      setError(
        e instanceof Error
          ? `마이크 권한이 필요해요: ${e.message}`
          : "마이크에 접근하지 못했어요.",
      );
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (recorder.state !== "inactive") recorder.stop();
  };

  // 녹음 중 취소 — 녹음물을 버리고 메뉴로 돌아간다.
  const cancelRecording = () => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = () => {
        stopAllTracks();
        clearTick();
        setRecording(false);
      };
      recorder.stop();
    } else {
      setRecording(false);
    }
  };

  // 미리듣기 완료본 폐기.
  const discardRecorded = () => {
    setRecorded((r: RecordedClip | null) => {
      if (r?.url) URL.revokeObjectURL(r.url);
      return null;
    });
  };

  // 미리듣기 후 전송 확정.
  const sendRecorded = () => {
    if (!recorded) return;
    onPickFile(recorded.blob, "audio");
    discardRecorded();
    onClose();
  };

  return (
    <>
      {/* Backdrop + sheet */}
      {open && (
        <div
          className="fixed inset-0 z-[55] flex items-end justify-center bg-black/60 backdrop-blur-[2px]"
          onClick={() => (recording ? null : onClose())}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] rounded-t-[20px] border-t border-white/15 bg-[#1f1235] px-[20px] pb-[24px] pt-[18px]"
          >
            {/* Drag handle */}
            <div className="mx-auto mb-[14px] h-[4px] w-[36px] rounded-full bg-white/25" />

            {recording ? (
              <RecordingPanel
                seconds={recordSeconds}
                maxSeconds={MAX_RECORD_SECONDS}
                onStop={stopRecording}
                onCancel={cancelRecording}
              />
            ) : recorded ? (
              <ReviewPanel
                url={recorded.url}
                seconds={recorded.seconds}
                onReRecord={() => {
                  discardRecorded();
                  startRecording();
                }}
                onSend={sendRecorded}
              />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-[10px]">
                  <Tile
                    icon={<Mic className="size-[26px] stroke-emerald-300" />}
                    label="음성 메시지"
                    onClick={startRecording}
                  />
                </div>
                {error && (
                  <p className="mt-[10px] text-center text-[11px] text-red-300">
                    {error}
                  </p>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-[14px] h-[40px] w-full rounded-[10px] border border-white/15 bg-white/5 text-[13px] font-medium text-white/75 hover:bg-white/10"
                >
                  취소
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Tile({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[88px] flex-col items-center justify-center gap-[8px] rounded-[14px] border border-white/10 bg-white/5 hover:bg-white/10"
    >
      {icon}
      <span className="text-[12px] font-medium text-white/85">{label}</span>
    </button>
  );
}

function RecordingPanel({
  seconds,
  maxSeconds,
  onStop,
  onCancel,
}: {
  seconds: number;
  maxSeconds: number;
  onStop: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-[14px] py-[10px]">
      <div className="relative grid size-[80px] place-items-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-red-500/40" />
        <Mic className="relative size-[36px] stroke-red-300" />
      </div>
      <p className="text-[14px] font-semibold text-white">
        녹음 중 · {fmtTime(seconds)} / {fmtTime(maxSeconds)}
      </p>
      <p className="text-[11px] text-white/55">
        최대 {maxSeconds}초까지 녹음돼요. 정지하면 들어보고 전송할 수 있어요.
      </p>
      <div className="mt-[6px] flex w-full gap-[10px]">
        <button
          type="button"
          onClick={onCancel}
          className="h-[44px] flex-1 rounded-[12px] border border-white/15 bg-white/5 text-[14px] font-medium text-white/75 hover:bg-white/10"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onStop}
          className="flex h-[44px] flex-1 items-center justify-center gap-[6px] rounded-[12px] bg-red-500 text-[14px] font-bold text-white hover:bg-red-600"
        >
          <Square className="size-[14px] fill-white stroke-white" />
          정지
        </button>
      </div>
    </div>
  );
}

function ReviewPanel({
  url,
  seconds,
  onReRecord,
  onSend,
}: {
  url: string;
  seconds: number;
  onReRecord: () => void;
  onSend: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-[12px] py-[6px]">
      <p className="text-[14px] font-semibold text-white">
        {fmtTime(seconds)} 녹음 완료 
      </p>
      <p className="text-[11px] text-white/55">
        들어보고 전송하세요.
      </p>
      {/* 본인 확인용 미리듣기 — 다운로드 차단 */}
      <audio
        src={url}
        controls
        controlsList="nodownload noplaybackrate"
        onContextMenu={(e) => e.preventDefault()}
        className="w-full"
      />
      <div className="mt-[6px] flex w-full gap-[10px]">
        <button
          type="button"
          onClick={onReRecord}
          className="h-[44px] flex-1 rounded-[12px] border border-white/15 bg-white/5 text-[14px] font-medium text-white/75 hover:bg-white/10"
        >
          다시 녹음
        </button>
        <button
          type="button"
          onClick={onSend}
          className="h-[44px] flex-1 rounded-[12px] bg-emerald-500 text-[14px] font-bold text-white hover:bg-emerald-600"
        >
          전송
        </button>
      </div>
    </div>
  );
}
