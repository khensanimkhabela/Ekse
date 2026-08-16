"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getStoredUser, register, storeSession, type Role } from "@/lib/auth";
import { CATEGORIES, PROVINCES } from "@/lib/data";
import { LockIcon, PersonIcon } from "./icons";

const ARTIST_CATEGORIES = CATEGORIES.filter((c) => c !== "All");
const ORGANIZER_TYPES = ["venue", "promoter", "brand", "individual"] as const;

const inputClasses =
  "bg-transparent flex-1 outline-none text-sm placeholder:text-textPlaceholder";
const pillFieldClasses = "flex items-center gap-3 bg-inputFill rounded-pill px-4 py-3.5 mb-3";
const selectClasses = "w-full bg-inputFill rounded-pill px-4 py-3.5 mb-3 text-sm outline-none";

/**
 * Sign-up card — same visual system as LoginCard, extended with a role
 * toggle (Artist / Organizer) and role-specific fields. Calls the real
 * backend (backend/routers/auth.py POST /auth/register), which auto-logs
 * the new account in.
 */
export function SignupCard() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("artist");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [province, setProvince] = useState("");
  const [stageName, setStageName] = useState("");
  const [category, setCategory] = useState<string>(ARTIST_CATEGORIES[0]);
  const [organizationName, setOrganizationName] = useState("");
  const [organizerType, setOrganizerType] = useState<string>(ORGANIZER_TYPES[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getStoredUser()) router.replace("/");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth = await register({
        role,
        email,
        password,
        full_name: fullName,
        province: province || undefined,
        ...(role === "artist"
          ? { stage_name: stageName, category: category.toLowerCase() }
          : { organization_name: organizationName, organizer_type: organizerType }),
      });
      storeSession(auth);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface rounded-card px-6 pt-8 pb-6 shadow-xl mx-4 -mt-10 relative z-10"
    >
      {/* Role toggle */}
      <div className="flex bg-inputFill rounded-pill p-1 mb-5">
        {(["artist", "organizer"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`flex-1 rounded-pill py-2.5 text-sm font-heading font-bold capitalize transition-colors ${
              role === r ? "bg-primary text-white" : "text-textBody"
            }`}
          >
            {r === "artist" ? "I'm an Artist" : "I'm an Organizer"}
          </button>
        ))}
      </div>

      <label className={pillFieldClasses}>
        <PersonIcon className="w-5 h-5 text-textPlaceholder shrink-0" />
        <input
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Full name"
          className={inputClasses}
        />
      </label>

      <label className={pillFieldClasses}>
        <PersonIcon className="w-5 h-5 text-textPlaceholder shrink-0" />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className={inputClasses}
        />
      </label>

      <label className={pillFieldClasses}>
        <LockIcon className="w-5 h-5 text-textPlaceholder shrink-0" />
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min. 8 characters)"
          className={inputClasses}
        />
      </label>

      <select value={province} onChange={(e) => setProvince(e.target.value)} className={selectClasses}>
        <option value="">Province (optional)</option>
        {PROVINCES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      {role === "artist" ? (
        <>
          <label className={pillFieldClasses}>
            <input
              required
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              placeholder="Stage name"
              className={inputClasses}
            />
          </label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClasses}>
            {ARTIST_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </>
      ) : (
        <>
          <label className={pillFieldClasses}>
            <input
              required
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="Organization / venue name"
              className={inputClasses}
            />
          </label>
          <select
            value={organizerType}
            onChange={(e) => setOrganizerType(e.target.value)}
            className={selectClasses}
          >
            {ORGANIZER_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">
                {t}
              </option>
            ))}
          </select>
        </>
      )}

      {error ? <p className="text-red-600 text-sm text-center mb-3">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white font-heading font-bold text-lg rounded-pill py-3.5 mt-1 shadow-sm active:scale-[0.99] transition-transform disabled:opacity-60"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-sm mt-5 text-textBody">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-semibold">
          Log in
        </Link>
      </p>
    </form>
  );
}
