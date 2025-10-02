// src/app/connections/page.tsx
"use client";

import InboxList from "@/components/connections/pane/InboxList";
import ProfilePreview from "@/components/connections/pane/ProfilePreview";

export default function ConnectionsHome() {
  return (
    <div className="min-h-[calc(100vh-72px)] grid grid-cols-12">
      {/* Left: now visible on mobile */}
      <InboxList />

      {/* Middle: always render a placeholder on the home route */}
      <main className="hidden lg:flex lg:col-span-6 items-center justify-center text-slate-500">
        Select a conversation
      </main>

      {/* Right: only on desktop */}
      <div className="hidden lg:block lg:col-span-3">
        <ProfilePreview />
      </div>
    </div>
  );
}
