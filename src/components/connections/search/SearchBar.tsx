// src/components/connections/search/SearchBar.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSearch } from "@/hooks/connections/useSearch";

export default function SearchBar() {
  const router = useRouter();
  const { q, setQ, results, loading, error, clear } = useSearch();
  const [open, setOpen] = React.useState(false);
  const boxRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // ✅ force boolean for `error` with !!
    setOpen(Boolean(q) && (loading || !!error || results.length > 0));
  }, [q, loading, error, results.length]);

  // click-outside to close
  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function startDM(targetUserId: string) {
    try {
      const res = await fetch("/api/connections/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      if (!res.ok) {
        setOpen(false);
        return;
      }
      const data = await res.json();
      setQ("");
      clear();
      setOpen(false);
      router.push(`/connections/chat/${data.threadId}`);
    } catch {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search (email, @handle, name)…"
        className="w-full rounded-lg border px-3 py-2 text-sm"
        onFocus={() => q && setOpen(true)}
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border bg-white shadow-lg">
          {loading && (
            <div className="px-3 py-2 text-xs text-slate-500">Searching…</div>
          )}
          {error && (
            <div className="px-3 py-2 text-xs text-red-600">{error}</div>
          )}
          {!loading && !error && results.length === 0 && (
            <div className="px-3 py-2 text-xs text-slate-500">No results</div>
          )}
          <ul className="max-h-80 overflow-y-auto">
            {results.map((u) => (
              <li
                key={u.userId}
                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                onClick={() => startDM(u.userId)}
              >
                <div className="h-7 w-7 rounded-full bg-slate-200 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {u.displayName ?? "User"}
                    {u.handle && (
                      <span className="text-slate-500"> · {u.handle}</span>
                    )}
                  </div>
                  {u.planTier && (
                    <div className="text-[11px] text-slate-500">{u.planTier}</div>
                  )}
                </div>
                <button className="text-xs rounded-md border px-2 py-1 hover:bg-slate-50">
                  Message
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
