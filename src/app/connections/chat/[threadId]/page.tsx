// src/app/connections/chat/[threadId]/page.tsx
"use client";

import * as React from "react";
import { useParams } from "next/navigation";

type Message = {
  messageId: string;
  senderId: string;
  createdAt: string;
  body: { type: "text" | "image"; text?: string; mediaUrl?: string };
  readBy: string[];
};
type MessagesResp = { items: Message[]; nextCursor: string | null };
type ThreadMeta = {
  threadId: string;
  participants: string[];
  other?: {
    userId: string;
    handle?: string;
    displayName?: string;
    avatarUrl?: string | null;
    college?: { id?: string; verified?: boolean };
    planTier?: "FREE" | "BASIC" | "PREMIUM";
  };
  lastMessageAt?: string;
  unread?: number;
};

export default function ChatByThreadIdPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const [meta, setMeta] = React.useState<ThreadMeta | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [metaRes, msgsRes] = await Promise.all([
          fetch(`/api/connections/threads/${threadId}`),
          fetch(`/api/connections/threads/${threadId}/messages`),
        ]);
        if (!metaRes.ok || !msgsRes.ok) throw new Error("Fetch failed");
        const metaJson = (await metaRes.json()) as ThreadMeta;
        const msgsJson = (await msgsRes.json()) as MessagesResp;
        if (!cancelled) {
          setMeta(metaJson);
          setMessages(msgsJson.items);
          setCursor(msgsJson.nextCursor ?? null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [threadId]);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/connections/threads/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: { type: "text", text } }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Send failed", err);
        return;
      }
      const msg = (await res.json()) as Message;
      setMessages((prev) => [...prev, msg]);
      setText("");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-slate-500">Loading thread…</div>
    );
  }

  if (!meta) {
    return (
      <div className="p-6 text-sm text-slate-500">
        Thread not found or you don’t have access.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Simple header */}
      <div className="border-b px-4 py-3">
        <div className="font-medium">
          {meta.other?.displayName ?? "Chat"}{" "}
          <span className="text-slate-500">
            {meta.other?.handle ? `· ${meta.other.handle}` : ""}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.map((m) => (
          <div key={m.messageId} className="max-w-[70%]">
            <div className="rounded-2xl bg-white/80 px-3 py-2 shadow-sm">
              {m.body.type === "text" ? m.body.text : "[image]"}
            </div>
            <div className="mt-1 text-[10px] text-slate-500">
              {new Date(m.createdAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <div className="border-t p-3">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border px-3 py-2 outline-none"
            placeholder="Message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            className="rounded-xl px-4 py-2 disabled:opacity-50 bg-teal-600 text-white"
            disabled={sending || !text.trim()}
            onClick={send}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
