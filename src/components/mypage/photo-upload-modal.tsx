"use client";

import { Camera, Check, ImagePlus, Star, Trash2, X } from "lucide-react";

import { ZamiVerifiedBadge } from "@/components/brand/zami-verified-badge";
import { useEffect, useRef, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { API_URL } from "@/lib/config";

const MAX_PHOTOS = 6;

type GalleryPhoto = {
  id: number;
  url: string;
  is_primary: boolean;
  is_face_verified: boolean;
  position: number;
  created_at: string;
};

type GalleryResponse = {
  photos: GalleryPhoto[];
  primary_photo_url: string | null;
};

type Props = {
  /** Currently-displayed primary photo (mypage's me.photo_url). */
  currentPhoto: string | null;
  onClose: () => void;
  /** Called whenever the primary photo URL changes (add/delete/promote)
   *  so the parent can keep its `me.photo_url` in sync without refetch. */
  onSave: (newPrimaryUrl: string | null) => void;
};

/**
 * Multi-photo gallery modal.
 *
 * - Lists existing photos (GET /users/me/photos).
 * - Add: 앨범 / 카메라 → POST /users/me/photos.
 * - Delete: per-photo trash icon → DELETE /users/me/photos/{id}.
 * - Set primary: per-photo star icon → PATCH /users/me/photos/{id}/primary.
 *
 * After every mutation we re-read the gallery to keep state simple.
 */
export function PhotoUploadModal({ currentPhoto, onClose, onSave }: Props) {
  const [photos, setPhotos] = useState<GalleryPhoto[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const albumRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const refresh = async (): Promise<GalleryResponse | null> => {
    try {
      const data = await apiFetch<GalleryResponse>("/users/me/photos");
      setPhotos(data.photos);
      onSave(data.primary_photo_url ?? null);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "사진 목록을 불러오지 못했어요");
      return null;
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If the gallery is empty but the legacy users.photo_url exists, render
  // the legacy photo as a non-deletable preview slot so the user always
  // sees their current photo.
  const legacyOnly = photos !== null && photos.length === 0 && currentPhoto;

  const onPick = async (file: File | null) => {
    if (!file || busy) return;
    if ((photos?.length ?? 0) >= MAX_PHOTOS) {
      setError(`사진은 최대 ${MAX_PHOTOS}장까지 등록 가능합니다.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = getToken();
      const resp = await fetch(`${API_URL}/users/me/photos`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!resp.ok) {
        const body = await resp.text();
        // FastAPI 응답은 { "detail": "..." } 형태. moderation 거절도
        // 이걸로 사용자용 한국어 사유가 내려오니 detail 만 노출.
        let detail: string | null = null;
        try {
          const parsed = JSON.parse(body) as { detail?: unknown };
          if (typeof parsed.detail === "string") detail = parsed.detail;
        } catch {
          /* not JSON */
        }
        throw new Error(detail ?? `${resp.status}: ${body}`);
      }
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: number) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/users/me/photos/${id}`, { method: "DELETE" });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setBusy(false);
    }
  };

  const onSetPrimary = async (id: number) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/users/me/photos/${id}/primary`, { method: "PATCH" });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "메인 사진 변경 실패");
    } finally {
      setBusy(false);
    }
  };

  const canAdd = (photos?.length ?? 0) < MAX_PHOTOS;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-[20px]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-[360px] overflow-y-auto rounded-[18px] border border-white/20 bg-white/95 p-[16px] backdrop-blur-md shadow-2xl"
      >
        <div className="relative flex items-center justify-center">
          <h2 className="text-[20px] font-bold tracking-tight text-[#1b1029]">
            프로필 사진 관리
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

        <p className="mt-[6px] text-center text-[12px] text-[#1b1029]/60">
          최대 {MAX_PHOTOS}장까지 등록 · 메인으로 표시한 사진이 매칭에서 보여요
        </p>

        {/* Gallery grid */}
        <div className="mt-[14px] grid grid-cols-3 gap-[8px]">
          {photos === null ? (
            <div className="col-span-3 grid h-[100px] place-items-center text-[12px] text-[#1b1029]/50">
              불러오는 중...
            </div>
          ) : (
            <>
              {photos.map((p) => (
                <PhotoTile
                  key={p.id}
                  photo={p}
                  busy={busy}
                  onSetPrimary={() => onSetPrimary(p.id)}
                  onDelete={() => onDelete(p.id)}
                />
              ))}

              {/* Legacy single-photo fallback — only when gallery is empty
                  but users.photo_url is set (e.g. legacy users uploaded
                  before the gallery existed). Prompts re-upload via the
                  ImagePlus tile below. */}
              {legacyOnly && (
                <div className="relative aspect-square overflow-hidden rounded-[12px] bg-zinc-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentPhoto ?? ""}
                    alt="기존 사진"
                    className="size-full object-cover opacity-90"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 py-[2px] text-center text-[10px] text-white">
                    이전 사진
                  </div>
                </div>
              )}

              {/* Add tile — visible until MAX is reached */}
              {canAdd && (
                <button
                  type="button"
                  onClick={() => albumRef.current?.click()}
                  disabled={busy}
                  className="grid aspect-square place-items-center rounded-[12px] border-2 border-dashed border-[#1b1029]/20 bg-zinc-50 text-[#1b1029]/55 hover:bg-zinc-100 disabled:opacity-50"
                >
                  <div className="flex flex-col items-center gap-[4px]">
                    <ImagePlus className="size-[26px] stroke-[1.5]" />
                    <span className="text-[11px] font-medium">사진 추가</span>
                  </div>
                </button>
              )}
            </>
          )}
        </div>

        {/* Action buttons — alternate sources for adding */}
        <div className="mt-[14px] flex gap-[8px]">
          <button
            type="button"
            onClick={() => albumRef.current?.click()}
            disabled={busy || !canAdd}
            className="flex h-[40px] flex-1 items-center justify-center gap-[6px] rounded-[12px] bg-white/70 text-[14px] font-medium text-[#1b1029] hover:bg-white disabled:opacity-50"
          >
            <ImagePlus className="size-[16px]" />
            앨범
          </button>
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={busy || !canAdd}
            className="flex h-[40px] flex-1 items-center justify-center gap-[6px] rounded-[12px] bg-white/70 text-[14px] font-medium text-[#1b1029] hover:bg-white disabled:opacity-50"
          >
            <Camera className="size-[16px]" />
            카메라
          </button>
        </div>

        <input
          ref={albumRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            onPick(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={(e) => {
            onPick(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />

        {error && (
          <p className="mt-[10px] text-center text-[11px] text-red-500">{error}</p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mx-auto mt-[16px] block h-[36px] w-[160px] rounded-[18px] text-[15px] font-semibold text-white shadow-[0px_0px_8px_2px_#7f55b4]"
          style={{
            backgroundImage:
              "linear-gradient(97deg, rgb(124, 58, 237) 0%, rgb(168, 85, 247) 100%)",
          }}
        >
          완료
        </button>
      </div>
    </div>
  );
}

function PhotoTile({
  photo,
  busy,
  onSetPrimary,
  onDelete,
}: {
  photo: GalleryPhoto;
  busy: boolean;
  onSetPrimary: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-[12px] bg-zinc-200">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt=""
        className="size-full object-cover"
      />
      {photo.is_primary && (
        <div className="absolute left-[6px] top-[6px] flex items-center gap-[3px] rounded-full bg-purple-500 px-[7px] py-[2px] text-[10px] font-semibold text-white shadow-[0_0_6px_-1px_rgba(168,85,247,0.7)]">
          <Star className="size-[10px] fill-white stroke-white" />
          메인
        </div>
      )}
      {/* ZAMI 공식 얼굴 인증 — strict face check 통과 사진에만 노출.
          사용자가 본인 갤러리에서 어떤 사진이 인증되었는지 확인 가능. */}
      {photo.is_face_verified && (
        <div className="absolute right-[6px] top-[6px]">
          <ZamiVerifiedBadge size="sm" />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 flex justify-end gap-[4px] bg-gradient-to-t from-black/55 to-transparent p-[4px]">
        {!photo.is_primary && (
          <button
            type="button"
            onClick={onSetPrimary}
            disabled={busy}
            aria-label="메인 사진으로"
            className="grid size-[26px] place-items-center rounded-full bg-white/85 text-[#1b1029] hover:bg-white disabled:opacity-40"
          >
            <Check className="size-[14px]" />
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          aria-label="삭제"
          className="grid size-[26px] place-items-center rounded-full bg-white/85 text-red-500 hover:bg-white disabled:opacity-40"
        >
          <Trash2 className="size-[14px]" />
        </button>
      </div>
    </div>
  );
}