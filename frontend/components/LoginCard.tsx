"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredUser, login, storeSession } from "@/lib/auth";
import { LockIcon, PersonIcon } from "./icons";

/**
 * White rounded card: grey pill inputs (email/password with icons),
 * Remember Me + Forgot Password row, full-width blue Login button, and a
 * "Create an account" link — per design-reference/af82402d-login_page.png.
 *
 * Calls the real backend (backend/routers/auth.py) — not a demo no-op.
 */
export function LoginCard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Already signed in (e.g. navigated back here manually) -> skip straight to home.
    if (getStoredUser()) router.replace("/");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = await login(email, password);
      storeSession(auth);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface rounded-card px-6 pt-8 pb-6 shadow-xl mx-4 -mt-10 relative z-10"
    >
      <label className="flex items-center gap-3 bg-inputFill rounded-pill px-4 py-3.5 mb-4">
        <PersonIcon className="w-5 h-5 text-textPlaceholder shrink-0" />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="bg-transparent flex-1 outline-none text-sm placeholder:text-textPlaceholder"
        />
      </label>

      <label className="flex items-center gap-3 bg-inputFill rounded-pill px-4 py-3.5 mb-3">
        <LockIcon className="w-5 h-5 text-textPlaceholder shrink-0" />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="bg-transparent flex-1 outline-none text-sm placeholder:text-textPlaceholder"
        />
      </label>

      <div className="flex items-center justify-between mb-4 px-1 text-sm">
        <label className="flex items-center gap-2 text-textBody">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="accent-primary"
          />
          Remember Me
        </label>
        <Link href="#" className="text-primary font-medium">
          Forgot Password?
        </Link>
      </div>

      {error ? <p className="text-red-600 text-sm text-center mb-3">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white font-heading font-bold text-lg rounded-pill py-3.5 shadow-sm active:scale-[0.99] transition-transform disabled:opacity-60"
      >
        {loading ? "Logging in…" : "Login"}
      </button>

      <p className="text-center text-sm mt-5 text-textBody">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary font-semibold">
          Create an account
        </Link>
      </p>
    </form>
  );
}
