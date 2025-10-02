// src/app/connections/dm/[userId]/page.tsx
"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";

export default function DMByUserIdPage() {
  const router = useRouter();
  const params = useParams<{ userId: string }>();

  React.useEffect(() => {
    let cancelled = false;

    async function go() {
      try {
        const res = await fetch("/api/connections/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId: params.userId }),
        });

        if (!res.ok) {
          // Handle common errors gracefully
          const data = await res.json().catch(() => ({}));
          console.error("Create-or-get thread failed", data);
          // Fallback to inbox if creation blocked (e.g., cross-college unpaid)
          router.replace("/connections");
          return;
        }

        const data = (await res.json()) as { threadId: string };
        if (!cancelled && data?.threadId) {
          router.replace(`/connections/chat/${data.threadId}`);
        } else {
          router.replace("/connections");
        }
      } catch (e) {
        console.error(e);
        router.replace("/connections");
      }
    }

    go();
    return () => {
      cancelled = true;
    };
  }, [params.userId, router]);

  // Tiny placeholder while redirecting
  return (
    <div className="flex h-full items-center justify-center text-sm text-slate-500">
      Starting chat…
    </div>
  );
}
