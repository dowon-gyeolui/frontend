/**
 * Chat API client + types. Wraps the REST endpoints we use from the chat
 * room page. Polling cadence is left to the caller (see usePollMessages).
 */

import { apiFetch } from "@/lib/api";

export type Message = {
  id: number;
  thread_id: number;
  sender_id: number;
  content: string;
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