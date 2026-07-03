// 채팅 REST API 클라이언트 + 타입 정의.
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
  created_at: string;
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
  unread_count: number;
};

export async function listThreads(): Promise<ChatThreadSummary[]> {
  return apiFetch<ChatThreadSummary[]>("/chat/threads");
}

export async function markThreadRead(peerId: number): Promise<void> {
  await apiFetch(`/chat/with/${peerId}/read`, { method: "POST" });
}

export async function leaveThread(threadId: number): Promise<void> {
  await apiFetch(`/chat/threads/${threadId}`, { method: "DELETE" });
}

export async function leaveChatWith(
  peerId: number,
  block = false,
): Promise<void> {
  const qs = block ? "?block=true" : "";
  await apiFetch(`/chat/with/${peerId}${qs}`, { method: "DELETE" });
}

export async function fetchMessagesWith(
  peerId: number,
  afterId?: number,
): Promise<Message[]> {
  const qs = afterId !== undefined ? `?after_id=${afterId}` : "";
  return apiFetch<Message[]>(`/chat/with/${peerId}/messages${qs}`);
}

const _prefetch = new Map<number, Promise<Message[]>>();

export function prefetchMessages(peerId: number): void {
  if (!_prefetch.has(peerId)) {
    _prefetch.set(peerId, fetchMessagesWith(peerId));
  }
}

export function consumePrefetch(peerId: number): Promise<Message[]> | undefined {
  const p = _prefetch.get(peerId);
  if (p) _prefetch.delete(peerId);
  return p;
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

export async function sendMediaMessageTo(
  peerId: number,
  file: Blob,
  mediaType: MediaType,
  caption?: string,
): Promise<Message> {
  const form = new FormData();
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
    let detail: string | null = null;
    try {
      const parsed = JSON.parse(body) as { detail?: unknown };
      if (typeof parsed.detail === "string") detail = parsed.detail;
    } catch {}
    throw new Error(detail ?? `API ${resp.status}: ${body}`);
  }
  return (await resp.json()) as Message;
}