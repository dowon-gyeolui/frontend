"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { API_URL } from "@/lib/config";
import { getToken } from "@/lib/auth";

/**
 * Photo upload modal — Figma "Mypage_profile_등록" frame.
 *
 * Flow: pick file → local preview via URL.createObjectURL → "저장하기"
 * uploads multipart to POST /users/me/photo → backend stores on Cloudinary,
 * updates users.photo_url, returns the CDN URL → onSave receives the
 * permanent URL the parent should use for further state updates.
 */
type Props = {
  currentPhoto: string | null;
  onClose: () => void;
  /** Called with the permanent CDN URL after a successful upload. */
  onSave: (newPhotoUrl: string) => void;
};

export function PhotoUploadModal({ currentPhoto, onClose, onSave }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhoto);
  const [isLocal, setIsLocal] = useState(false); // tracks whether to revoke URL
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // Revoke any local object URLs when this modal unmounts to avoid leaks.
  useEffect(() => {
    return () => {
      if (isLocal && previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [isLocal, previewUrl]);

  const onPick = (file: File | null) => {
    if (!file) return;
    if (isLocal && previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsLocal(true);
    setPickedFile(file);
    setError(null);
  };

  const handleSave = async () => {
    if (!pickedFile || uploading) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", pickedFile);
      const token = getToken();
      const resp = await fetch(`${API_URL}/users/me/photo`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(`${resp.status}: ${body}`);
      }
      const data = (await resp.json()) as { photo_url: string | null };
      if (!data.photo_url) throw new Error("서버가 사진 URL 을 반환하지 않았어요");
      onSave(data.photo_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "업로드 실패");
      setUploading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-[20px]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[341px] rounded-[18px] border border-white/20 bg-white/95 p-[16px] backdrop-blur-md shadow-2xl"
      >
        {/* Header */}
        <div className="relative flex items-center justify-center">
          <h2 className="text-[20px] font-bold tracking-tight text-[#1b1029]">
            프로필 사진 등록
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="absolute right-0 top-0"
          >
            <X className="size-[20px] stroke-[#1b1029]" />
          </button>
        </div>

        {/* Photo preview */}
        <div className="mt-[16px] grid place-items-center">
          <div className="relative aspect-[251/287] w-[251px] overflow-hidden rounded-[12px] bg-zinc-200">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="profile preview"
                className="size-full object-cover"
              />
            ) : (
              <div className="grid size-full place-items-center text-zinc-400">
                미리보기
              </div>
            )}
          </div>
        </div>

        {/* Slider control (single photo for now — placeholder) */}
        <div className="mt-[10px] flex items-center justify-center gap-[18px]">
          <ChevronLeft className="size-[20px] stroke-[#1b1029]/60" />
          <span className="grid size-[26px] place-items-center rounded-full bg-purple-500 text-[14px] font-semibold text-white">
            1
          </span>
          <ChevronRight className="size-[20px] stroke-[#1b1029]/60" />
        </div>

        {/* Action rows */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mt-[14px] h-[37px] w-full rounded-[12px] border border-white/20 bg-white/50 text-[16px] font-medium text-[#1b1029] backdrop-blur-sm hover:bg-white/70"
        >
          앨범에서 선택하기
        </button>
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="mt-[10px] h-[37px] w-full rounded-[12px] border border-white/20 bg-white/50 text-[16px] font-medium text-[#1b1029] backdrop-blur-sm hover:bg-white/70"
        >
          카메라로 촬영하기
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          // mobile browsers honour `capture` to open the camera directly
          capture="user"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />

        {error && (
          <p className="mt-[12px] text-center text-[11px] text-red-500">{error}</p>
        )}

        {/* Save */}
        <button
          type="button"
          disabled={!pickedFile || uploading}
          onClick={handleSave}
          className="mx-auto mt-[16px] block h-[30px] w-[149px] rounded-[18px] text-[16px] font-semibold text-white shadow-[0px_0px_8px_2px_#7f55b4] disabled:opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(97deg, rgb(124, 58, 237) 0%, rgb(168, 85, 247) 100%)",
          }}
        >
          {uploading ? "업로드 중..." : "저장하기"}
        </button>
      </div>
    </div>
  );
}