"use client";

import * as React from "react";

type Conversation = {
  threadId: string;
  other: { userId: string; displayName?: string; handle?: string; avatarUrl?: string | null };
  lastMessage?: { preview?: string; at?: string | null; from?: string };
  unread?: number;
};

export function useInbox() {
  const [items, setItems] = React.useState<Conversation[]>([]);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/connections/inbox${cursor ? `?cursor=${cursor}` : ""}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { items: Conversation[]; nextCursor: string | null };
      setItems((prev) => (cursor ? [...prev, ...data.items] : data.items));
      setCursor(data.nextCursor);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }, [cursor]);

  React.useEffect(() => { load(); }, [load]);

  function resetAndReload() {
    setItems([]);
    setCursor(null);
  }

  return { items, loading, error, fetchNext: () => cursor && load(), resetAndReload };
}
