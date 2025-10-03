// src/components/connections/search/SearchResults.tsx
"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import type { SearchUser } from "@/hooks/connections/useSearch";

export function SearchResults({
  results,
  onClose,
}: {
  results: SearchUser[];
  onClose?: () => void;
}) {
  const router = useRouter();

  const onMessage = async (userId: string) => {
    // Create/find thread then navigate to it
    const r = await fetch("/api/connections/threads", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (r.ok) {
      const { threadId } = await r.json();
      onClose?.();
      router.push(`/connections/chat/${threadId}`);
    } else if (r.status === 403) {
      // gated (cross-college rule)
      alert("Messaging is gated by plan/college rules.");
    } else {
      alert("Could not start conversation.");
    }
  };

  return (
    <ul className="space-y-2">
      {results.map((u) => (
        <li
          key={u.userId}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-900"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="relative h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
              {u.avatarUrl && (
                <Image src={u.avatarUrl} alt="" fill sizes="32px" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">
                {u.displayName || u.handle || u.emailLower}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {u.handle ? `@${u.handle}` : u.emailLower}
                {u.collegeName ? ` · ${u.collegeName}` : ""}
              </div>
            </div>
          </div>
          <button
            onClick={() => onMessage(u.userId)}
            className="text-xs px-3 py-1 rounded-full border border-teal-600 text-teal-700 hover:bg-teal-50"
          >
            Message
          </button>
        </li>
      ))}
    </ul>
  );
}
