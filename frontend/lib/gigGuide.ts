/**
 * An artist's personal Gig Guide — performance history + upcoming bookings,
 * editable by the artist themselves. There's no backend table for this yet
 * (schema.sql's `bookings`/`events` cover platform-mediated bookings only;
 * this is meant to also hold gigs an artist landed off-platform), so it's a
 * genuinely-working, localStorage-backed CRUD layer, same pattern as
 * lib/postInteractions.ts — keyed per signed-in user, seeded with demo
 * gigs the first time a given user opens the page.
 */
export type GigStatus = "confirmed" | "pending" | "completed" | "cancelled";

export type Gig = {
  id: string;
  title: string;
  venue: string;
  city: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  feeZar?: number;
  status: GigStatus;
  organizer?: string;
  notes?: string;
};

const KEY_PREFIX = "fimiya_gig_guide_";

function isoDate(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
}

function seedGigs(): Gig[] {
  return [
    {
      id: "seed-1",
      title: "Bassline Fest — Night 1",
      venue: "Bassline Fest",
      city: "Johannesburg",
      date: isoDate(-30),
      time: "20:00",
      feeZar: 3500,
      status: "completed",
      organizer: "Bassline Fest",
      notes: "Sound check at 17:00. Bring your own DI box.",
    },
    {
      id: "seed-2",
      title: "Durban Nights — Chill Room Set",
      venue: "Chill Room",
      city: "Durban",
      date: isoDate(-10),
      time: "21:30",
      feeZar: 2800,
      status: "completed",
      organizer: "Durban Nights Entertainment",
    },
    {
      id: "seed-3",
      title: "Private wedding booking",
      venue: "Fernwood Estate",
      city: "Stellenbosch",
      date: isoDate(14),
      time: "16:00",
      feeZar: 6000,
      status: "confirmed",
      organizer: "Private client",
      notes: "Acoustic set only, no PA needed — couple is providing sound.",
    },
    {
      id: "seed-4",
      title: "Open Mic Night",
      venue: "Tshwane Arts Council",
      city: "Pretoria",
      date: isoDate(25),
      time: "19:00",
      status: "pending",
      organizer: "Tshwane Arts Council",
      notes: "Waiting on final lineup confirmation.",
    },
    {
      id: "seed-5",
      title: "Community Showcase",
      venue: "Ekse Community Hall",
      city: "Johannesburg",
      date: isoDate(45),
      time: "18:00",
      feeZar: 4200,
      status: "confirmed",
      organizer: "Ekse Community Events",
    },
  ];
}

function storageKey(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

export function getGigs(userId: string): Gig[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(storageKey(userId));
  if (raw) {
    try {
      return JSON.parse(raw) as Gig[];
    } catch {
      // fall through and reseed a corrupted value
    }
  }
  const seeded = seedGigs();
  localStorage.setItem(storageKey(userId), JSON.stringify(seeded));
  return seeded;
}

function saveGigs(userId: string, gigs: Gig[]): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(gigs));
}

/** Insert (new id) or update (existing id) a gig, returns the full updated list. */
export function upsertGig(userId: string, gig: Gig): Gig[] {
  const gigs = getGigs(userId);
  const index = gigs.findIndex((g) => g.id === gig.id);
  if (index >= 0) {
    gigs[index] = gig;
  } else {
    gigs.unshift(gig);
  }
  saveGigs(userId, gigs);
  return gigs;
}

export function deleteGig(userId: string, gigId: string): Gig[] {
  const gigs = getGigs(userId).filter((g) => g.id !== gigId);
  saveGigs(userId, gigs);
  return gigs;
}

export function sortGigsByDate(gigs: Gig[]): Gig[] {
  return [...gigs].sort((a, b) => a.date.localeCompare(b.date));
}
