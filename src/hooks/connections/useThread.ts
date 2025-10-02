"use client";

import * as React from "react";

type Body = { type: "text" | "image"; text?: string; mediaUrl?: string };
export type Message = {
  messageId: string;
  senderId: string;
  createdAt: string;
  body: Body;
  readBy: string[];
};
type MessagesResp = { items: Message[]; nextCursor: string | null };

export function useThread(threadId: string | undefined) {
  const [meta, setMeta] = React.useState<any>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!threadId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [m1, m2] = await Promise.all([
          fetch(`/api/connections/threads/${threadId}`, { cache: "no-store" }),
          fetch(`/api/connections/threads/${threadId}/messages`, { cache: "no-store" }),
        ]);
        if (!m1.ok || !m2.ok) throw new Error("Failed to load thread");
        const metaJson = await m1.json();
        const msgsJson = (await m2.json()) as MessagesResp;
        if (!cancelled) {
          setMeta(metaJson);
          setMessages(msgsJson.items);
          setCursor(msgsJson.nextCursor);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [threadId]);

  async function fetchMore() {
    if (!threadId || !cursor) return;
    const res = await fetch(`/api/connections/threads/${threadId}/messages?cursor=${cursor}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as MessagesResp;
    setMessages((prev) => [...prev, ...data.items]);
    setCursor(data.nextCursor);
  }

  return { meta, messages, loading, fetchMore, setMessages };
}
