// src/components/connections/modals/NewMessageModal.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSearch } from "@/hooks/connections/useSearch";

export default function NewMessageModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { q, setQ, results, loading, error, clear } = useSearch();

  async function startDM(userId: string) {
    const res = await fetch("/api/connections/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: userId }),
    });
    if (!res.ok) {
      // TODO toast with reason
      return;
    }
    const data = await res.json();
    clear();
    setQ("");
    onClose();
    router.push(`/connections/chat/${data.threadId}`);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="font-semibold">New message</div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            ✕
          </button>
        </div>
        <div className="p-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by email, @handle, or name…"
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          {loading && <div className="mt-2 text-xs text-slate-500">Searching…</div>}
          {error && <div className="mt-2 text-xs text-red-600">{error}</div>}

          <ul className="mt-3 max-h-72 overflow-y-auto divide-y">
            {results.map((u) => (
              <li key={u.userId} className="flex items-center gap-2 px-2 py-2">
                <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden">
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
                <button
                  onClick={() => startDM(u.userId)}
                  className="text-xs rounded-md border px-2 py-1 hover:bg-slate-50"
                >
                  Message
                </button>
              </li>
            ))}
            {!loading && results.length === 0 && q && (
              <li className="px-2 py-3 text-xs text-slate-500">
                No users found for “{q}”.
              </li>
            )}
          </ul>
        </div>
        <div className="border-t px-4 py-3 text-right">
          <button onClick={onClose} className="rounded-md border px-3 py-1.5 text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
