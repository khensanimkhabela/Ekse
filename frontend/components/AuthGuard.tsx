"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredUser, type AuthUser } from "@/lib/auth";

/**
 * Client-side route guard for the (app) route group (Home/Explore/Profile/
 * Friends/Messages). No session in localStorage -> redirect to /login.
 *
 * This is a client-only check (the session lives in localStorage, not a
 * cookie — see lib/auth.ts), so there's an unavoidable blank first paint
 * while it runs; a server-rendered session check would need to move the
 * token into an httpOnly cookie.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // undefined = not checked yet, null = checked and signed out, AuthUser = signed in
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    if (!stored) {
      router.replace("/login");
    }
  }, [router]);

  if (!user) return null;
  return <>{children}</>;
}
