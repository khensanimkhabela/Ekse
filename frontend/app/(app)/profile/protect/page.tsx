"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackArrowIcon, LockIcon } from "@/components/icons";
import { draftContract, getArtistById, type ContractDraft } from "@/lib/api";
import { getStoredUser, getToken, type AuthUser } from "@/lib/auth";
import { COMPLIANCE_BODIES } from "@/lib/compliance";

const EMPTY_DRAFT = {
  organizerName: "",
  eventTitle: "",
  eventDate: "",
  feeZar: "" as number | "",
  city: "",
};

function riskLabel(score: number): { label: string; className: string } {
  if (score < 0.2) return { label: "Low risk", className: "bg-green-100 text-green-700" };
  if (score < 0.5) return { label: "Medium risk", className: "bg-amber-100 text-amber-700" };
  return { label: "High risk", className: "bg-red-100 text-red-600" };
}

/**
 * Protect Your Work — reached from the Profile menu. Two parts: a
 * contract-drafting form powered by the real AI Contract Generator
 * (backend/routers/contracts.py's POST /contracts/draft, same engine the
 * booking flow uses — see lib/api.ts's draftContract), and a list of real
 * South African rights/compliance bodies (lib/compliance.ts, verified via
 * web search, not guessed) an artist should register with. No reference
 * screen for this exists in /design-reference.
 */
export default function ProtectWorkPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [artistName, setArtistName] = useState("");
  const [artistCategory, setArtistCategory] = useState<string | null>(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [result, setResult] = useState<ContractDraft | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    if (stored) {
      setArtistName(stored.full_name);
      if (stored.artist_id) {
        getArtistById(stored.artist_id).then((artist) => {
          if (artist) {
            setArtistName(artist.stage_name);
            setArtistCategory(artist.category);
          }
        });
      }
    }
  }, []);

  const sortedBodies = [...COMPLIANCE_BODIES].sort((a, b) => {
    const aMatch = artistCategory && a.relevantFor.some((c) => c.toLowerCase() === artistCategory.toLowerCase()) ? 0 : 1;
    const bMatch = artistCategory && b.relevantFor.some((c) => c.toLowerCase() === artistCategory.toLowerCase()) ? 0 : 1;
    return aMatch - bMatch;
  });

  async function handleDraft(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token || !draft.feeZar) return;
    setDrafting(true);
    setDraftError(null);
    setResult(null);
    try {
      const draftResult = await draftContract(
        {
          artist_name: artistName,
          organizer_name: draft.organizerName.trim(),
          event_title: draft.eventTitle.trim(),
          event_date: draft.eventDate,
          fee_zar: Number(draft.feeZar),
          city: draft.city.trim() || undefined,
        },
        token
      );
      setResult(draftResult);
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : "Couldn't draft a contract right now.");
    } finally {
      setDrafting(false);
    }
  }

  const inputClasses = "w-full bg-inputFill rounded-pill px-4 py-3 text-sm outline-none placeholder:text-textPlaceholder";
  const canDraft = artistName.trim() && draft.organizerName.trim() && draft.eventTitle.trim() && draft.eventDate && draft.feeZar;

  return (
    <main>
      <header className="bg-primary rounded-b-card px-4 pt-5 pb-6 flex items-center gap-3">
        <button type="button" onClick={() => router.push("/profile")} aria-label="Back" className="text-white shrink-0">
          <BackArrowIcon className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center font-heading font-bold text-white text-lg truncate">Protect Your Work</h1>
        <div className="w-6 shrink-0" aria-hidden />
      </header>

      <div className="px-4 pt-5 pb-4 flex flex-col gap-5">
        {/* Contract drafting */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <LockIcon className="w-5 h-5 text-primary" />
            <p className="font-heading font-bold text-xl text-textHeading">Draft a Contract</p>
          </div>
          <p className="text-sm text-textBody/70 mb-3">
            Fill in the gig details and Fimiya&apos;s AI Contract Generator will draft fair, standard clauses and flag any risk —
            same engine used when a booking goes through the platform.
          </p>

          <form onSubmit={handleDraft} className="flex flex-col gap-3">
            <input
              required
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Your artist / stage name"
              className={inputClasses}
            />
            <input
              required
              value={draft.organizerName}
              onChange={(e) => setDraft({ ...draft, organizerName: e.target.value })}
              placeholder="Organizer / promoter name"
              className={inputClasses}
            />
            <input
              required
              value={draft.eventTitle}
              onChange={(e) => setDraft({ ...draft, eventTitle: e.target.value })}
              placeholder="Event title"
              className={inputClasses}
            />
            <div className="flex gap-3">
              <input
                required
                type="date"
                value={draft.eventDate}
                onChange={(e) => setDraft({ ...draft, eventDate: e.target.value })}
                className={`${inputClasses} flex-1`}
              />
              <input
                required
                type="number"
                min={1}
                value={draft.feeZar}
                onChange={(e) => setDraft({ ...draft, feeZar: e.target.value ? Number(e.target.value) : "" })}
                placeholder="Fee (ZAR)"
                className={`${inputClasses} flex-1`}
              />
            </div>
            <input
              value={draft.city}
              onChange={(e) => setDraft({ ...draft, city: e.target.value })}
              placeholder="City / venue (optional)"
              className={inputClasses}
            />

            <button
              type="submit"
              disabled={!canDraft || drafting}
              className="w-full bg-primary text-white font-heading font-bold text-lg rounded-pill py-3.5 mt-1 shadow-sm active:scale-[0.99] transition-transform disabled:opacity-50"
            >
              {drafting ? "Drafting…" : "Draft Contract"}
            </button>
          </form>

          {draftError ? (
            <p className="text-textHeading font-heading font-medium bg-white/40 rounded-tile px-4 py-4 text-center mt-3">
              {draftError}
            </p>
          ) : null}

          {result ? (
            <div className="bg-surface rounded-card p-4 shadow-sm mt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="font-heading font-bold text-textBody">Draft Contract</p>
                <span className={`text-xs font-heading font-bold rounded-pill px-2.5 py-1 ${riskLabel(result.risk_score).className}`}>
                  {riskLabel(result.risk_score).label}
                </span>
              </div>
              <pre className="whitespace-pre-wrap font-body text-xs text-textBody/90 bg-inputFill rounded-tile p-3 max-h-64 overflow-y-auto">
                {result.contract_text}
              </pre>
              {result.risk_flags.length > 0 ? (
                <ul className="mt-3 flex flex-col gap-1">
                  {result.risk_flags.map((flag, i) => (
                    <li key={i} className="text-xs text-red-600 flex gap-1.5">
                      <span aria-hidden>⚠</span>
                      {flag}
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="text-xs text-textBody/60 mt-2">{result.market_rate_note}</p>
            </div>
          ) : null}
        </section>

        {/* Compliance registrations */}
        <section>
          <p className="font-heading font-bold text-xl text-textHeading mb-1">Compliance Registrations</p>
          <p className="text-sm text-textBody/70 mb-3">
            Real South African bodies that protect your work and make sure you get paid what you&apos;re owed
            {artistCategory ? ` — sorted for a ${artistCategory} artist` : ""}.
          </p>
          <div className="flex flex-col gap-3">
            {sortedBodies.map((body) => (
              <div key={body.id} className="bg-surface rounded-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-heading font-bold text-textBody">{body.name}</p>
                    <p className="text-xs text-primary font-semibold">{body.fullName}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end shrink-0 max-w-[45%]">
                    {body.relevantFor.map((tag) => (
                      <span key={tag} className="text-[10px] font-heading font-bold bg-inputFill text-textBody/70 rounded-pill px-2 py-0.5">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-textBody/80 mt-2">{body.description}</p>
                <a
                  href={body.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm font-heading font-bold text-primary mt-2"
                >
                  Visit official site →
                </a>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
