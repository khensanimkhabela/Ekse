"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackArrowIcon, EditIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { getStoredUser, type AuthUser } from "@/lib/auth";
import {
  deleteGig,
  getGigs,
  sortGigsByDate,
  upsertGig,
  type Gig,
  type GigStatus,
} from "@/lib/gigGuide";

const STATUS_STYLES: Record<GigStatus, string> = {
  confirmed: "bg-primary/10 text-primary",
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

const STATUS_LABELS: Record<GigStatus, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
};

function formatGigDate(dateStr: string, time?: string): string {
  const parsed = new Date(`${dateStr}T00:00:00`);
  const formatted = Number.isNaN(parsed.getTime())
    ? dateStr
    : parsed.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  return time ? `${formatted} · ${time}` : formatted;
}

function formatFee(feeZar?: number): string | null {
  if (feeZar == null) return null;
  return `R${feeZar.toLocaleString("en-ZA")}`;
}

const EMPTY_DRAFT: Gig = {
  id: "",
  title: "",
  venue: "",
  city: "",
  date: "",
  time: "",
  feeZar: undefined,
  status: "pending",
  organizer: "",
  notes: "",
};

/**
 * Gig Guide — an artist's editable performance history + upcoming
 * bookings. No reference screen for this exists in /design-reference, so
 * built from the same tokens as the rest of the app. There's no backend
 * table for this yet (see lib/gigGuide.ts docstring), so it's a genuinely
 * working, localStorage-backed CRUD screen, seeded with demo gigs on first
 * visit — organizer accounts see the same data read-only, per the brief.
 */
export default function GigGuidePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [mode, setMode] = useState<"list" | "form">("list");
  const [draft, setDraft] = useState<Gig>(EMPTY_DRAFT);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    if (stored) setGigs(sortGigsByDate(getGigs(stored.id)));
  }, []);

  const canEdit = user?.role === "artist";

  function openAddForm() {
    setDraft({ ...EMPTY_DRAFT, id: `gig-${Date.now()}` });
    setMode("form");
  }

  function openEditForm(gig: Gig) {
    setDraft(gig);
    setMode("form");
  }

  function handleDelete(gigId: string) {
    if (!user) return;
    setGigs(sortGigsByDate(deleteGig(user.id, gigId)));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const cleaned: Gig = {
      ...draft,
      title: draft.title.trim(),
      venue: draft.venue.trim(),
      city: draft.city.trim(),
      organizer: draft.organizer?.trim() || undefined,
      notes: draft.notes?.trim() || undefined,
    };
    if (!cleaned.title || !cleaned.venue || !cleaned.city || !cleaned.date) return;
    setGigs(sortGigsByDate(upsertGig(user.id, cleaned)));
    setMode("list");
  }

  return (
    <main>
      <header className="bg-primary rounded-b-card px-4 pt-5 pb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (mode === "form" ? setMode("list") : router.push("/profile"))}
          aria-label="Back"
          className="text-white shrink-0"
        >
          <BackArrowIcon className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center font-heading font-bold text-white text-lg truncate">
          {mode === "form" ? (gigs.some((g) => g.id === draft.id) ? "Edit Gig" : "Add Gig") : "Gig Guide"}
        </h1>
        {mode === "list" && canEdit ? (
          <button type="button" onClick={openAddForm} aria-label="Add gig" className="text-white shrink-0">
            <PlusIcon className="w-6 h-6" />
          </button>
        ) : (
          <div className="w-6 shrink-0" aria-hidden />
        )}
      </header>

      <div className="px-4 pt-5">
        {!canEdit ? (
          <p className="text-textHeading font-heading font-medium bg-white/40 rounded-tile px-4 py-3 mb-4 text-center text-sm">
            You&apos;re viewing this artist&apos;s Gig Guide — organizers can view, only the artist can edit.
          </p>
        ) : null}

        {mode === "form" ? (
          <GigForm draft={draft} setDraft={setDraft} onSave={handleSave} />
        ) : gigs.length === 0 ? (
          <p className="text-textHeading font-heading font-medium bg-white/40 rounded-tile px-4 py-6 text-center">
            No gigs yet{canEdit ? " — tap + to add your first one." : "."}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {gigs.map((gig) => (
              <GigCard key={gig.id} gig={gig} canEdit={canEdit} onEdit={openEditForm} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function GigCard({
  gig,
  canEdit,
  onEdit,
  onDelete,
}: {
  gig: Gig;
  canEdit: boolean;
  onEdit: (gig: Gig) => void;
  onDelete: (gigId: string) => void;
}) {
  const fee = formatFee(gig.feeZar);
  return (
    <div className="bg-surface rounded-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-heading font-bold text-textBody">{gig.title}</p>
          <p className="text-sm text-primary font-semibold truncate">
            {gig.venue} · {gig.city}
          </p>
        </div>
        <span className={`shrink-0 text-xs font-heading font-bold rounded-pill px-2.5 py-1 ${STATUS_STYLES[gig.status]}`}>
          {STATUS_LABELS[gig.status]}
        </span>
      </div>

      <p className="text-sm text-textBody/80 mt-2">{formatGigDate(gig.date, gig.time)}</p>
      {fee ? <p className="text-sm font-heading font-bold text-textBody mt-0.5">{fee}</p> : null}
      {gig.organizer ? <p className="text-xs text-textBody/70 mt-1">Organizer: {gig.organizer}</p> : null}
      {gig.notes ? <p className="text-xs text-textBody/70 mt-1 line-clamp-2">{gig.notes}</p> : null}

      {canEdit ? (
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-inputFill">
          <button
            type="button"
            onClick={() => onEdit(gig)}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            <EditIcon className="w-4 h-4" /> Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(gig.id)}
            className="flex items-center gap-1.5 text-sm font-semibold text-red-500"
          >
            <TrashIcon className="w-4 h-4" /> Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

function GigForm({
  draft,
  setDraft,
  onSave,
}: {
  draft: Gig;
  setDraft: (g: Gig) => void;
  onSave: (e: React.FormEvent) => void;
}) {
  const inputClasses = "w-full bg-inputFill rounded-pill px-4 py-3 text-sm outline-none placeholder:text-textPlaceholder";
  const canSubmit = draft.title.trim() && draft.venue.trim() && draft.city.trim() && draft.date;

  return (
    <form onSubmit={onSave} className="flex flex-col gap-3 pb-4">
      <input
        required
        value={draft.title}
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        placeholder="Gig title (e.g. Bassline Fest — Night 1)"
        className={inputClasses}
      />
      <input
        required
        value={draft.venue}
        onChange={(e) => setDraft({ ...draft, venue: e.target.value })}
        placeholder="Venue"
        className={inputClasses}
      />
      <input
        required
        value={draft.city}
        onChange={(e) => setDraft({ ...draft, city: e.target.value })}
        placeholder="City / town"
        className={inputClasses}
      />
      <div className="flex gap-3">
        <input
          required
          type="date"
          value={draft.date}
          onChange={(e) => setDraft({ ...draft, date: e.target.value })}
          className={`${inputClasses} flex-1`}
        />
        <input
          type="time"
          value={draft.time ?? ""}
          onChange={(e) => setDraft({ ...draft, time: e.target.value })}
          className={`${inputClasses} flex-1`}
        />
      </div>
      <input
        type="number"
        min={0}
        value={draft.feeZar ?? ""}
        onChange={(e) => setDraft({ ...draft, feeZar: e.target.value ? Number(e.target.value) : undefined })}
        placeholder="Fee (ZAR, optional)"
        className={inputClasses}
      />
      <select
        value={draft.status}
        onChange={(e) => setDraft({ ...draft, status: e.target.value as GigStatus })}
        className={inputClasses}
      >
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <input
        value={draft.organizer ?? ""}
        onChange={(e) => setDraft({ ...draft, organizer: e.target.value })}
        placeholder="Organizer / contact (optional)"
        className={inputClasses}
      />
      <textarea
        value={draft.notes ?? ""}
        onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
        placeholder="Notes — technical rider, arrangements, etc. (optional)"
        rows={3}
        className="w-full bg-inputFill rounded-tile px-4 py-3 text-sm outline-none resize-none placeholder:text-textPlaceholder"
      />

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-primary text-white font-heading font-bold text-lg rounded-pill py-3.5 mt-1 shadow-sm active:scale-[0.99] transition-transform disabled:opacity-50"
      >
        Save gig
      </button>
    </form>
  );
}
