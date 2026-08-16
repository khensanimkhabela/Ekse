/**
 * Client for the parts of the backend that the Explore flow now consumes
 * live (town-level artist listings) — most of the frontend still renders
 * from local mock data (see lib/data.ts), but this is real.
 */
// 127.0.0.1, not "localhost" — resolving "localhost" adds real, measurable
// connection delay here (Node prefers IPv6 first, uvicorn only binds IPv4).
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export type ApiArtist = {
  id: string;
  stage_name: string;
  category: string;
  genres: string | null;
  bio: string | null;
  town: string | null;
  province: string | null;
  hourly_rate_zar: number | null;
  years_active: number | null;
  reputation_score: number;
};

export type ArtistsResult = { artists: ApiArtist[]; error: boolean };

export async function getArtistsByTown(opts: {
  town: string;
  province?: string;
  genre?: string;
}): Promise<ArtistsResult> {
  const qs = new URLSearchParams({ town: opts.town });
  if (opts.province) qs.set("province", opts.province);
  if (opts.genre) qs.set("genre", opts.genre);

  try {
    const res = await fetch(`${API_URL}/artists?${qs.toString()}`, { cache: "no-store" });
    if (!res.ok) return { artists: [], error: true };
    return { artists: await res.json(), error: false };
  } catch {
    // Backend not running — degrade gracefully rather than crashing the page.
    return { artists: [], error: true };
  }
}

/** Used by the Protect Your Work page to know the signed-in artist's
 * category, so it can surface the most relevant compliance bodies first. */
export async function getArtistById(artistId: string): Promise<ApiArtist | null> {
  try {
    const res = await fetch(`${API_URL}/artists/${artistId}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** Powers the top-nav search bar (components/Header.tsx) — matches artist
 * name, genre, town, category or bio, backend/routers/artists.py's `search` filter. */
export async function searchArtists(query: string): Promise<ArtistsResult> {
  const qs = new URLSearchParams({ search: query });
  try {
    const res = await fetch(`${API_URL}/artists?${qs.toString()}`, { cache: "no-store" });
    if (!res.ok) return { artists: [], error: true };
    return { artists: await res.json(), error: false };
  } catch {
    return { artists: [], error: true };
  }
}

export type ChatIntent = "bookings" | "artist_of_week" | "events_near_me" | "general";

export type ChatResponse = {
  reply: string;
  intent: ChatIntent;
  detected_language: string;
  data: Record<string, unknown>;
};

/** Calls backend/routers/chat.py — requires the caller's JWT (see lib/auth.ts's getToken()). */
export async function sendChatMessage(message: string, token: string): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(typeof body.detail === "string" ? body.detail : `Chat request failed (${res.status})`);
  }
  return res.json();
}

export type WalletTransaction = {
  id: string;
  event_title: string;
  amount_zar: number;
  gross_zar: number;
  commission_zar: number;
  status: string;
  date: string;
};

export type Wallet = {
  earned_zar: number;
  pending_zar: number;
  total_revenue_zar: number;
  estimated_tax_zar: number;
  taxable_income_zar: number;
  effective_tax_rate_pct: number;
  sars_filing_due: string;
  completed_bookings: number;
  pending_bookings: number;
  transactions: WalletTransaction[];
};

export type WalletResult =
  | { wallet: Wallet; status: "ok" }
  | { wallet: null; status: "not-artist" | "error" };

/** Calls backend/routers/wallet.py — real payments ledger + a live AI Tax
 * Assistant estimate, requires the caller's JWT. 404 means the signed-in
 * user has no artist profile (organizer accounts don't have a wallet). */
export async function getWallet(token: string): Promise<WalletResult> {
  try {
    const res = await fetch(`${API_URL}/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.status === 404) return { wallet: null, status: "not-artist" };
    if (!res.ok) return { wallet: null, status: "error" };
    return { wallet: await res.json(), status: "ok" };
  } catch {
    return { wallet: null, status: "error" };
  }
}

export type ContractDraftRequest = {
  artist_name: string;
  organizer_name: string;
  event_title: string;
  event_date: string;
  fee_zar: number;
  city?: string;
};

export type ContractDraft = {
  contract_text: string;
  risk_score: number;
  risk_flags: string[];
  market_rate_note: string;
};

/** Calls backend/routers/contracts.py's POST /contracts/draft — the same
 * AI Contract Generator the real booking flow uses, standalone (no booking
 * created). Requires the caller's JWT. */
export async function draftContract(payload: ContractDraftRequest, token: string): Promise<ContractDraft> {
  const res = await fetch(`${API_URL}/contracts/draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(typeof body.detail === "string" ? body.detail : `Draft failed (${res.status})`);
  }
  return res.json();
}
