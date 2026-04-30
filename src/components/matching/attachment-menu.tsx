"use client";

import { Camera, Image as ImageIcon, Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * 채팅 + 버튼 메뉴 — 사진 / 카메라 / 음성 메시지.
 *
 * 부모(ChatRoomPage)는 file 만 받아 sendMediaMessageTo 로 업로드한다.
 * 음성은 MediaRecorder API 로 녹음 후 Blob 으로 emit. 녹음 UI 는 메뉴
 * 안에서 자체 처리(시작/정지 버튼).
 */
export function AttachmentMenu({
  open,
  onClose,
  onPickFile,
}: {
  open: boolean;
  onClose: () => void;
  onPickFile: (file: Blob, kind: "image" | "audio") => void;
}) {
  const photoRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
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
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        stopAllTracks();
        setRecording(false);
        if (tickRef.current) {
          window.clearInterval(tickRef.current);
          tickRef.current = null;
        }
        if (blob.size > 0) {
          onPickFile(blob, "audio");
          onClose();
        }
      };
      recorder.start();
      startTimeRef.current = Date.now();
      setRecording(true);
      setRecordSeconds(0);
      tickRef.current = window.setInterval(() => {
        setRecordSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
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

  const handlePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    onPickFile(f, "image");
    onClose();
    // reset so picking the same file twice still fires onChange
    e.target.value = "";
  };

  return (
    <>
      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePicked}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePicked}
      />

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
                onStop={stopRecording}
                onCancel={() => {
                  // discard recording
                  const recorder = recorderRef.current;
                  if (recorder && recorder.state !== "inactive") {
                    recorder.onstop = () => {
                      stopAllTracks();
                      if (tickRef.current) {
                        window.clearInterval(tickRef.current);
                        tickRef.current = null;
                      }
                      setRecording(false);
                    };
                    recorder.stop();
                  } else {
                    setRecording(false);
                  }
                }}
              />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-[10px]">
                  <Tile
                    icon={<ImageIcon className="size-[26px] stroke-purple-300" />}
                    label="사진"
                    onClick={() => photoRef.current?.click()}
                  />
                  <Tile
                    icon={<Camera className="size-[26px] stroke-pink-300" />}
                    label="카메라"
                    onClick={() => cameraRef.current?.click()}
                  />
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
  onStop,
  onCancel,
}: {
  seconds: number;
  onStop: () => void;
  onCancel: () => void;
}) {
  const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");
  return (
    <div className="flex flex-col items-center gap-[14px] py-[10px]">
      <div className="relative grid size-[80px] place-items-center">
        <div className="absolute inset-0 animate-ping rounded-full bg-red-500/40" />
        <Mic className="relative size-[36px] stroke-red-300" />
      </div>
      <p className="text-[14px] font-semibold text-white">
        녹음 중 · {mm}:{ss}
      </p>
      <p className="text-[11px] text-white/55">
        정지 버튼을 누르면 음성이 전송됩니다.
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
          정지 · 전송
        </button>
      </div>
    </div>
  );
}