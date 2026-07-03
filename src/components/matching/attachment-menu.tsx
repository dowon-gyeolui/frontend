"use client";
// 채팅방 + 버튼 첨부 메뉴 — 음성 메시지 녹음/미리듣기/전송 바텀시트.

import { Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MAX_RECORD_SECONDS = 30;

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
  const [recorded, setRecorded] = useState<RecordedClip | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startTimeRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !recording) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, recording]);

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

  const discardRecorded = () => {
    setRecorded((r: RecordedClip | null) => {
      if (r?.url) URL.revokeObjectURL(r.url);
      return null;
    });
  };

  const sendRecorded = () => {
    if (!recorded) return;
    onPickFile(recorded.blob, "audio");
    discardRecorded();
    onClose();
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[55] flex items-end justify-center bg-black/60 backdrop-blur-[2px]"
          onClick={() => (recording ? null : onClose())}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] rounded-t-[20px] border-t border-white/15 bg-[#1f1235] px-[20px] pb-[24px] pt-[18px]"
          >
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