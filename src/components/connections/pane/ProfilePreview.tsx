// src/components/connections/pane/ProfilePreview.tsx
"use client";

type MiniUser = {
  displayName?: string;
  handle?: string;
  avatarUrl?: string | null;
  planTier?: "FREE" | "BASIC" | "PREMIUM" | null;
};

export default function ProfilePreview({ user }: { user?: MiniUser }) {
  return (
    <aside className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-slate-200 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div>
            <div className="text-sm font-semibold">{user?.displayName ?? "Profile"}</div>
            {user?.handle && <div className="text-xs text-slate-500">{user.handle}</div>}
          </div>
        </div>
      </div>

      <div className="p-4 text-sm text-slate-600">
        {/* Future: college/plan badges, mutuals, follow buttons */}
        Select a conversation to see their profile.
      </div>
    </aside>
  );
}
