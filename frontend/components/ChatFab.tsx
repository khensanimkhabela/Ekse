"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatSparkleIcon } from "./icons";

// Screens with their own bottom input row (comment box, post form, the
// assistant's own chat input) — the floating button would sit on top of
// and intercept clicks meant for that row, especially on shorter pages
// where the row ends up in the same screen region as the FAB.
const HIDDEN_ON_PREFIXES = [
  "/assistant",
  "/post/",
  "/profile/create-post",
  "/profile/gig-guide",
  "/profile/tickets",
  "/profile/protect",
];

/**
 * Floating action button, reachable from most (app) screens, opening the
 * AI Assistant (bookings / Artist of the Week / events near me — see
 * app/(app)/assistant). Positioned to clear the fixed BottomTabBar.
 */
export function ChatFab() {
  const pathname = usePathname();
  if (HIDDEN_ON_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;

  return (
    <Link
      href="/assistant"
      aria-label="Ask the Ekse Assistant"
      className="fixed z-30 bottom-24 right-4 w-14 h-14 rounded-full bg-primary shadow-lg flex items-center justify-center active:scale-95 transition-transform"
    >
      <ChatSparkleIcon className="w-6 h-6 text-brandGreen" />
    </Link>
  );
}
