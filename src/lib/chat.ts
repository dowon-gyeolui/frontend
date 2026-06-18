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
  /** Number of messages from the peer the current user hasn't seen yet. */
  unread_count: number;
};

export async function listThreads(): Promise<ChatThreadSummary[]> {
  return apiFetch<ChatThreadSummary[]>("/chat/threads");
}

/**
 * Mark all messages in the thread with `peerId` as read by the current
 * user. Server bumps the per-user `last_read_id` to the latest message.
 *
 * Called by the chat room on mount and whenever a poll yields new
 * messages so the badge drops to 0 the moment the user is looking.
 */
export async function markThreadRead(peerId: number): Promise<void> {
  await apiFetch(`/chat/with/${peerId}/read`, { method: "POST" });
}

/**
 * Soft-leave a chat thread (KakaoTalk-style 1:1 leave). The thread
 * disappears from the current user's list. The other user keeps
 * seeing the history. Server hard-deletes the thread only when both
 * users have left.
 */
export async function leaveThread(threadId: number): Promise<void> {
  await apiFetch(`/chat/threads/${threadId}`, { method: "DELETE" });
}

/**
 * 채팅방 나가기 — peer 기준. 채팅방 헤더의 '방 나가기' 에서 사용.
 *
 * block=false: soft-leave(내 목록에서만 사라짐). block=true: 차단 —
 * 상대 쪽 방까지 삭제하고 이후 매칭·추천·채팅에서 영구 제외.
 */
export async function leaveChatWith(
  peerId: number,
  block = false,
): Promise<void> {
  const qs = block ? "?block=true" : "";
  await apiFetch(`/chat/with/${peerId}${qs}`, { method: "DELETE" });
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
    let detail: string | null = null;
    try {
      const parsed = JSON.parse(body) as { detail?: unknown };
      if (typeof parsed.detail === "string") detail = parsed.detail;
    } catch {
      /* not JSON */
    }
    throw new Error(detail ?? `API ${resp.status}: ${body}`);
  }
  return (await resp.json()) as Message;
}