"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HamburgerIcon, MicIcon, SearchIcon } from "./icons";

/**
 * Top App Header — every screen except Login and Profile.
 * Rounded-bottom blue banner: green mic icon (top-left), white pill search
 * bar (center), circular user avatar (top-right).
 *
 * The search bar is real: submitting (Enter, or tapping the search icon)
 * navigates to /search?q=..., which queries the backend's GET /artists
 * `search` filter (name, genre, town, category, bio) — see app/(app)/search.
 */
export function Header({ avatarUrl, initialQuery = "" }: { avatarUrl?: string; initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <header className="bg-primary rounded-b-card px-4 pt-5 pb-6 flex items-center gap-3">
      <MicIcon className="text-brandGreen w-7 h-7 shrink-0 -rotate-12" />
      <form
        onSubmit={handleSubmit}
        className="flex-1 bg-surface rounded-pill flex items-center gap-2 px-4 py-2.5"
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search here …"
          aria-label="Search artists"
          className="flex-1 bg-transparent outline-none text-sm text-textBody placeholder:text-textPlaceholder min-w-0"
        />
        <button type="submit" aria-label="Search" className="shrink-0">
          <SearchIcon className="w-4 h-4 text-brandGreen" />
        </button>
      </form>
      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-white/30 relative">
        {avatarUrl ? (
          <Image src={avatarUrl} alt="Your profile" fill sizes="40px" className="object-cover" />
        ) : null}
      </div>
    </header>
  );
}

export function TopHamburger() {
  return <HamburgerIcon className="w-6 h-6 text-primary" />;
}
