// src/components/connections/pane/InboxList.tsx
"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useInbox } from "@/hooks/connections/useInbox";
import SearchBar from "@/components/connections/search/SearchBar";

export default function InboxList() {
  const router = useRouter();
  const pathname = usePathname();
  const { items, loading, error } = useInbox();

  return (
    // ✅ visible on mobile now; spans full width on small screens
    <aside className="col-span-12 lg:col-span-3 flex flex-col border-r min-h-full">
      {/* Header with search */}
      <div className="p-3 border-b flex items-center gap-2">
        <div className="flex-1">
          <SearchBar />
        </div>
      </div>

      {/* Body: conversations */}
      <div className="flex-1 overflow-y-auto">
        {loading && <div className="p-3 text-xs text-slate-500">Loading…</div>}
        {error && <div className="p-3 text-xs text-red-600">{error}</div>}
        {!loading && items.length === 0 && (
          <div className="p-3 text-xs text-slate-500">No conversations yet.</div>
        )}

        <ul className="divide-y">
          {items.map((c) => {
            const active = pathname?.endsWith(`/chat/${c.threadId}`);
            return (
              <li
                key={c.threadId}
                className={`px-3 py-2 cursor-pointer hover:bg-white/70 ${active ? "bg-white" : ""}`}
                onClick={() => router.push(`/connections/chat/${c.threadId}`)}
              >
                <div className="text-sm font-medium">
                  {c.other.displayName ?? "User"}{" "}
                  <span className="text-slate-500">
                    {c.other.handle ? `· ${c.other.handle}` : ""}
                  </span>
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {c.lastMessage?.preview ?? ""}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
