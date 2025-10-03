// src/app/connections/page.tsx
"use client";

import InboxList from "@/components/connections/pane/InboxList";
import ProfilePreview from "@/components/connections/pane/ProfilePreview";

export default function ConnectionsHome() {
  return (
    // Push content below your fixed/sticky Navbar (≈72–80px tall)
    <div className="min-h-screen pt-[72px] md:pt-[80px] bg-white dark:bg-neutral-950">
      {/* 3-pane grid fills the rest of the viewport under the navbar */}
      <section className="grid grid-cols-12 gap-0 h-[calc(100svh-72px)] md:h-[calc(100svh-80px)]">
        {/* LEFT (Inbox + Search). Full width on mobile, 3 columns on desktop */}
        <aside
          className="col-span-12 lg:col-span-3 border-r border-gray-200 dark:border-neutral-800
                     flex flex-col min-h-0 overflow-hidden"
        >
          {/* InboxList should render its own sticky SearchBar at the top.
              This container ensures the pane can scroll without going under the navbar. */}
          <InboxList />
        </aside>

        {/* MIDDLE (Thread). Hidden until a chat is selected on desktop */}
        <main
          className="hidden lg:flex lg:col-span-6 items-center justify-center
                     text-slate-500 dark:text-slate-400"
        >
          Select a conversation
        </main>

        {/* RIGHT (Profile Preview). Desktop only */}
        <aside className="hidden lg:block lg:col-span-3 border-l border-gray-200 dark:border-neutral-800">
          <ProfilePreview />
        </aside>
      </section>
    </div>
  );
}
