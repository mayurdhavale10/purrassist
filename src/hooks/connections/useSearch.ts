// src/hooks/connections/useSearch.ts
import { useEffect, useMemo, useRef, useState } from "react";

export type SearchUser = {
  userId: string;
  emailLower?: string;
  handle?: string;
  displayName?: string;
  avatarUrl?: string;
  collegeName?: string;
  planTier?: "FREE" | "BASIC" | "PREMIUM";
};

export function useConnectionsSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // simple debounce
  const debounced = useDebounce(query, 300);

  useEffect(() => {
    if (!debounced) {
      setResults([]);
      setError(null);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const r = await fetch(`/api/users/search?q=${encodeURIComponent(debounced)}`, {
          method: "GET",
          credentials: "include",
          signal: ctrl.signal,
        });
        if (!r.ok) {
          const t = await r.text().catch(() => "");
          throw new Error(`Search failed: ${r.status} ${t}`);
        }
        const data = await r.json();
        setResults(data.results ?? []);
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e.message || "Search failed");
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [debounced]);

  return { query, setQuery, results, loading, error };
}

function useDebounce<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}
