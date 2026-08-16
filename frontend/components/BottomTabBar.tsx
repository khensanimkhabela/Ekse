"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CompassIcon, FriendsIcon, HomeIcon, MessagesIcon, PersonIcon } from "./icons";

const TABS = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/explore", label: "Explore", icon: CompassIcon },
  { href: "/profile", label: "Profile", icon: PersonIcon },
  { href: "/friends", label: "Friends", icon: FriendsIcon },
  { href: "/messages", label: "Messages", icon: MessagesIcon },
] as const;

/**
 * Fixed blue rounded bottom bar, 5 items. The Profile tab is a raised
 * circular button popping above the bar. Active tab renders green,
 * inactive tabs render white.
 */
export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20">
      <div className="max-w-[430px] mx-auto bg-primary rounded-t-card px-2 pt-2 pb-3 flex items-end justify-between">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          const isProfile = tab.label === "Profile";

          if (isProfile) {
            return (
              <Link key={tab.href} href={tab.href} className="flex flex-col items-center -mt-6">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center border-4 border-primary ${
                    active ? "bg-brandGreen/40" : "bg-white/20"
                  }`}
                >
                  <Icon className={`w-6 h-6 ${active ? "text-brandGreen" : "text-white"}`} />
                </div>
                <span className={`text-[11px] font-heading font-semibold mt-1 ${active ? "text-brandGreen" : "text-white"}`}>
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link key={tab.href} href={tab.href} className="flex flex-col items-center gap-0.5 px-1 py-1">
              <Icon className={`w-5 h-5 ${active ? "text-brandGreen" : "text-white"}`} />
              <span className={`text-[11px] font-heading font-semibold ${active ? "text-brandGreen" : "text-white"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
