// src/components/connections/pane/InboxList.tsx (snippet)
import { SearchBar } from "@/components/connections/search/SearchBar";

export default function InboxList() {
  return (
    <aside className="h-full w-full flex flex-col">
      <SearchBar />
      {/* …then your existing tabs (Chats / Following / Followers) and the conversation list */}
      {/* <FiltersToggle /> */}
      {/* <Conversations …/> */}
    </aside>
  );
}
