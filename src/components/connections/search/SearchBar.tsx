// src/components/connections/search/SearchBar.tsx
"use client";

import { useConnectionsSearch } from "@/hooks/connections/useSearch";
import { SearchResults } from "./SearchResults";

export function SearchBar() {
  const { query, setQuery, results, loading, error } = useConnectionsSearch();

  return (
    <div className="p-3 border-b border-gray-200 dark:border-gray-800">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search (email, @handle, name)…"
        className="w-full rounded-lg px-3 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 outline-none text-sm"
      />
      {/* Results panel */}
      {query.length > 0 && (
        <div className="mt-3">
          {loading && <div className="text-xs text-gray-500">Searching…</div>}
          {error && <div className="text-xs text-red-600">{error}</div>}
          {!loading && !error && (
            <SearchResults results={results} onClose={() => setQuery("")} />
          )}
          {!loading && !error && results.length === 0 && (
            <div className="text-xs text-gray-500 mt-2">No matches.</div>
          )}
        </div>
      )}
    </div>
  );
}
