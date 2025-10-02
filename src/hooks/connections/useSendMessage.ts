"use client";

import * as React from "react";
import type { Message } from "./useThread";

export function useSendMessage(threadId: string | undefined, append: (m: Message) => void) {
  const [sending, setSending] = React.useState(false);

  async function sendText(text: string) {
    if (!threadId || !text.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/connections/threads/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: { type: "text", text } }),
      });
      if (!res.ok) return;
      const msg = (await res.json()) as Message;
      append(msg);
    } finally {
      setSending(false);
    }
  }

  return { sending, sendText };
}
