import Link from "next/link";
import { ChatSparkleIcon } from "./icons";

/**
 * Home feed entry point into the AI Chat Assistant (app/(app)/assistant) —
 * more discoverable than the floating chat button alone (components/ChatFab.tsx,
 * which stays available on every screen; this is the Home-page-specific one).
 */
export function AssistantBanner() {
  return (
    <Link
      href="/assistant"
      className="flex items-center gap-3 bg-primary rounded-card px-4 py-3.5 shadow-sm active:scale-[0.99] transition-transform"
    >
      <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
        <ChatSparkleIcon className="w-5 h-5 text-brandGreen" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-heading font-bold text-white leading-tight">Ask Ekse Assistant</p>
        <p className="text-white/80 text-xs leading-tight truncate">
          Bookings, Artist of the Week, events near you…
        </p>
      </div>
    </Link>
  );
}
