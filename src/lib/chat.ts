/**
 * Chat API client + types. Wraps the REST endpoints we use from the chat
 * room page. Polling cadence is left to the caller (see usePollMessages).
 */

import { API_URL } from "@/lib/config";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

export type MediaType = "image" | "audio";

export type Message = {
  id: number;
  thread_id: number;
  sender_id: number;
  content: string;
  media_url: string | null;
  media_type: MediaType | null;
  created_at: string; // ISO 8601
};

export type ChatPeer = {
  user_id: number;
  nickname: string | null;
  photo_url: string | null;
};

export type ChatThreadSummary = {
  thread_id: number;
  peer: ChatPeer;
  last_message: Message | null;
  updated_at: string;
};

export async function listThreads(): Promise<ChatThreadSummary[]> {
  return apiFetch<ChatThreadSummary[]>("/chat/threads");
}

/**
 * Fetch messages with `peer_id`. Pass `afterId` to get only newer messages
 * (poll mode). Initial load uses afterId=undefined to fetch the full history.
 */
export async function fetchMessagesWith(
  peerId: number,
  afterId?: number,
): Promise<Message[]> {
  const qs = afterId !== undefined ? `?after_id=${afterId}` : "";
  return apiFetch<Message[]>(`/chat/with/${peerId}/messages${qs}`);
}

export async function sendMessageTo(
  peerId: number,
  content: string,
): Promise<Message> {
  return apiFetch<Message>(`/chat/with/${peerId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

/**
 * 미디어 첨부 메시지(사진/카메라/음성) 전송. 텍스트 caption 은 선택.
 * apiFetch 가 JSON 헤더를 강제하므로 multipart 는 native fetch 로 직접.
 */
export async function sendMediaMessageTo(
  peerId: number,
  file: Blob,
  mediaType: MediaType,
  caption?: string,
): Promise<Message> {
  const form = new FormData();
  // file 의 원래 이름이 있으면 유지, 없으면 mediaType 으로 추정 fallback.
  const filename =
    file instanceof File && file.name
      ? file.name
      : mediaType === "image"
        ? "photo.jpg"
        : "voice.webm";
  form.append("file", file, filename);
  form.append("media_type", mediaType);
  if (caption) form.append("caption", caption);

  const token = getToken();
  const resp = await fetch(`${API_URL}/chat/with/${peerId}/messages/media`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`API ${resp.status}: ${body}`);
  }
  return (await resp.json()) as Message;
}