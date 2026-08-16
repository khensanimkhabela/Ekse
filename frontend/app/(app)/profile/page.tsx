"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ListPill } from "@/components/ListPill";
import { ProfileHeader } from "@/components/ProfileHeader";
import { LockIcon, LogoutIcon, PlusIcon, WalletIcon } from "@/components/icons";
import { clearSession, getStoredUser, type AuthUser } from "@/lib/auth";
import { PROFILE_MENU } from "@/lib/data";

const ICONS = { plus: PlusIcon, lock: LockIcon, wallet: WalletIcon } as const;
const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  // AuthGuard (app/(app)/layout.tsx) already guarantees a session exists
  // by the time this renders; read it here to show the real signed-in
  // artist/organizer instead of a hardcoded name.
  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  function handleLogout() {
    clearSession();
    router.push("/login");
  }

  return (
    <main>
      <ProfileHeader
        name={user?.full_name ?? "Kaylee"}
        role={user ? (user.role === "artist" ? "Artist" : "Organizer") : "Artist & poet"}
        avatarUrl={FALLBACK_AVATAR}
      />
      <div className="px-4 pt-5 flex flex-col gap-3">
        {PROFILE_MENU.map((item) => (
          <ListPill
            key={item.label}
            label={item.label}
            href={"href" in item ? item.href : undefined}
            icon={"icon" in item && item.icon ? ICONS[item.icon] : undefined}
          />
        ))}
        <ListPill label="Log out" icon={LogoutIcon} onClick={handleLogout} />
      </div>
    </main>
  );
}
