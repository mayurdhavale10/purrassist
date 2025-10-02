// src/hooks/connections/useSearch.ts
"use client";

import * as React from "react";

export type SearchUser = {
  userId: string;
  displayName?: string;
  handle?: string;
  avatarUrl?: string | null;
  collegeId?: string | null;
  planTier?: "FREE" | "BASIC" | "PREMIUM" | null;
};

export function useSearch() {
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<SearchUser[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Debounce
  React.useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const id = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/users/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { items: SearchUser[] };
        setResults(data.items ?? []);
      } catch (e: any) {
        setError(e?.message ?? "Search failed");
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [q]);

  return { q, setQ, results, loading, error, clear: () => setResults([]) };
}
