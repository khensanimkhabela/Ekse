"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackArrowIcon, PlusIcon } from "@/components/icons";
import { QRCode } from "@/components/QRCode";
import { getStoredUser, type AuthUser } from "@/lib/auth";
import { addListing, buyTicket, getListings, getMyTickets, type PurchasedTicket, type TicketListing } from "@/lib/tickets";

function formatEventDate(dateStr: string, time?: string): string {
  const parsed = new Date(`${dateStr}T00:00:00`);
  const formatted = Number.isNaN(parsed.getTime())
    ? dateStr
    : parsed.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  return time ? `${formatted} · ${time}` : formatted;
}

function formatZar(amount: number): string {
  return `R${amount.toLocaleString("en-ZA")}`;
}

const EMPTY_DRAFT = {
  eventTitle: "",
  venue: "",
  city: "",
  date: "",
  time: "",
  ticketType: "General",
  priceZar: "" as number | "",
  totalQuantity: "" as number | "",
  image: "",
};

/**
 * Event Tickets — reached from the Profile menu's "Tickets" button.
 * Computicket-style: browse ticket listings with a poster image, price and
 * a quantity stepper, buy, then find the ticket (with a demo QR — see
 * components/QRCode.tsx) under "My Tickets". Both artists and organizers
 * get the same capabilities here — add listings AND buy — unlike Gig
 * Guide, per the brief. No backend `tickets` table yet (see
 * lib/tickets.ts), so this is a genuinely-working, localStorage-backed
 * demo layer, seeded with 5 listings across real demo events/organizers.
 */
export default function TicketsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [tab, setTab] = useState<"buy" | "mine">("buy");
  const [listings, setListings] = useState<TicketListing[]>([]);
  const [myTickets, setMyTickets] = useState<PurchasedTicket[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [justBoughtId, setJustBoughtId] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    setListings(getListings());
    if (stored) setMyTickets(getMyTickets(stored.id));
  }, []);

  function handleBuy(listing: TicketListing, quantity: number) {
    if (!user) return;
    const ticket: PurchasedTicket = {
      id: `ticket-${Date.now()}`,
      listingId: listing.id,
      eventTitle: listing.eventTitle,
      venue: listing.venue,
      city: listing.city,
      date: listing.date,
      time: listing.time,
      ticketType: listing.ticketType,
      priceZar: listing.priceZar,
      quantity,
      buyerName: user.full_name,
      purchasedAt: new Date().toISOString(),
    };
    setMyTickets(buyTicket(user.id, ticket));
    setJustBoughtId(ticket.id);
    setTab("mine");
  }

  function handleAddListing(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const price = Number(draft.priceZar);
    const quantity = Number(draft.totalQuantity);
    if (!draft.eventTitle.trim() || !draft.venue.trim() || !draft.city.trim() || !draft.date || !price) return;

    const listing: TicketListing = {
      id: `listing-${Date.now()}`,
      eventTitle: draft.eventTitle.trim(),
      venue: draft.venue.trim(),
      city: draft.city.trim(),
      date: draft.date,
      time: draft.time || undefined,
      ticketType: draft.ticketType.trim() || "General",
      priceZar: price,
      totalQuantity: quantity || 50,
      image: draft.image.trim() || `https://picsum.photos/seed/ekse-ticket-${Date.now()}/600/360`,
      addedByName: user.full_name,
    };
    setListings(addListing(listing));
    setDraft(EMPTY_DRAFT);
    setShowAddForm(false);
    setTab("buy");
  }

  return (
    <main>
      <header className="bg-primary rounded-b-card px-4 pt-5 pb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (showAddForm ? setShowAddForm(false) : router.push("/profile"))}
          aria-label="Back"
          className="text-white shrink-0"
        >
          <BackArrowIcon className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center font-heading font-bold text-white text-lg truncate">
          {showAddForm ? "Add Ticket" : "Tickets"}
        </h1>
        {!showAddForm ? (
          <button type="button" onClick={() => setShowAddForm(true)} aria-label="Add ticket listing" className="text-white shrink-0">
            <PlusIcon className="w-6 h-6" />
          </button>
        ) : (
          <div className="w-6 shrink-0" aria-hidden />
        )}
      </header>

      <div className="px-4 pt-5">
        {showAddForm ? (
          <AddListingForm draft={draft} setDraft={setDraft} onSave={handleAddListing} />
        ) : (
          <>
            <div className="flex bg-inputFill rounded-pill p-1 mb-4">
              {(["buy", "mine"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`flex-1 rounded-pill py-2.5 text-sm font-heading font-bold transition-colors ${
                    tab === t ? "bg-primary text-white" : "text-textBody"
                  }`}
                >
                  {t === "buy" ? "Buy Tickets" : `My Tickets${myTickets.length ? ` (${myTickets.length})` : ""}`}
                </button>
              ))}
            </div>

            {tab === "buy" ? (
              listings.length === 0 ? (
                <p className="text-textHeading font-heading font-medium bg-white/40 rounded-tile px-4 py-6 text-center">
                  No tickets on sale yet — tap + to list one.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {listings.map((listing) => (
                    <TicketListingCard key={listing.id} listing={listing} onBuy={handleBuy} />
                  ))}
                </div>
              )
            ) : myTickets.length === 0 ? (
              <p className="text-textHeading font-heading font-medium bg-white/40 rounded-tile px-4 py-6 text-center">
                No tickets bought yet — head to Buy Tickets to grab one.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {myTickets.map((ticket) => (
                  <MyTicketCard key={ticket.id} ticket={ticket} highlight={ticket.id === justBoughtId} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function TicketListingCard({
  listing,
  onBuy,
}: {
  listing: TicketListing;
  onBuy: (listing: TicketListing, quantity: number) => void;
}) {
  const [qty, setQty] = useState(1);

  return (
    <div className="bg-surface rounded-card overflow-hidden shadow-sm">
      <div className="relative w-full aspect-[5/3]">
        <Image src={listing.image} alt="" fill sizes="400px" className="object-cover" />
        <span className="absolute top-2 right-2 bg-primary text-white text-xs font-heading font-bold rounded-pill px-2.5 py-1">
          {listing.ticketType}
        </span>
      </div>
      <div className="p-4">
        <p className="font-heading font-bold text-textBody">{listing.eventTitle}</p>
        <p className="text-sm text-primary font-semibold truncate">
          {listing.venue} · {listing.city}
        </p>
        <p className="text-sm text-textBody/80 mt-1">{formatEventDate(listing.date, listing.time)}</p>

        <div className="flex items-center justify-between mt-3">
          <p className="font-heading font-extrabold text-lg text-textBody">{formatZar(listing.priceZar)}</p>
          <div className="flex items-center gap-1 bg-inputFill rounded-pill px-1 py-1">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="w-7 h-7 rounded-full bg-surface font-heading font-bold text-primary"
            >
              −
            </button>
            <span className="w-6 text-center text-sm font-heading font-bold text-textBody">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(10, q + 1))}
              aria-label="Increase quantity"
              className="w-7 h-7 rounded-full bg-surface font-heading font-bold text-primary"
            >
              +
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onBuy(listing, qty)}
          className="w-full bg-primary text-white font-heading font-bold rounded-pill py-3 mt-3 active:scale-[0.99] transition-transform"
        >
          Buy Now — {formatZar(listing.priceZar * qty)}
        </button>
      </div>
    </div>
  );
}

function MyTicketCard({ ticket, highlight = false }: { ticket: PurchasedTicket; highlight?: boolean }) {
  return (
    <div className={`bg-surface rounded-card overflow-hidden shadow-sm ${highlight ? "ring-2 ring-primary" : ""}`}>
      <div className="bg-primary px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-heading font-bold text-white truncate">{ticket.eventTitle}</p>
          <p className="text-white/80 text-xs truncate">
            {ticket.venue} · {ticket.city}
          </p>
        </div>
        <span className="shrink-0 bg-white/15 text-white text-xs font-heading font-bold rounded-pill px-2.5 py-1">
          {ticket.ticketType}
        </span>
      </div>
      <div className="p-4 flex gap-4 items-center">
        <QRCode seed={ticket.id} size={100} />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-textBody/80">{formatEventDate(ticket.date, ticket.time)}</p>
          <p className="text-sm font-heading font-bold text-textBody mt-1">
            {ticket.quantity}× ticket{ticket.quantity > 1 ? "s" : ""}
          </p>
          <p className="text-sm text-textBody/80">{formatZar(ticket.priceZar * ticket.quantity)} total</p>
          <p className="text-xs text-textBody/60 mt-1 truncate">{ticket.buyerName}</p>
        </div>
      </div>
    </div>
  );
}

function AddListingForm({
  draft,
  setDraft,
  onSave,
}: {
  draft: typeof EMPTY_DRAFT;
  setDraft: (d: typeof EMPTY_DRAFT) => void;
  onSave: (e: React.FormEvent) => void;
}) {
  const inputClasses = "w-full bg-inputFill rounded-pill px-4 py-3 text-sm outline-none placeholder:text-textPlaceholder";
  const canSubmit = draft.eventTitle.trim() && draft.venue.trim() && draft.city.trim() && draft.date && Number(draft.priceZar) > 0;

  return (
    <form onSubmit={onSave} className="flex flex-col gap-3 pb-4">
      <input
        required
        value={draft.eventTitle}
        onChange={(e) => setDraft({ ...draft, eventTitle: e.target.value })}
        placeholder="Event title"
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
          value={draft.time}
          onChange={(e) => setDraft({ ...draft, time: e.target.value })}
          className={`${inputClasses} flex-1`}
        />
      </div>
      <input
        value={draft.ticketType}
        onChange={(e) => setDraft({ ...draft, ticketType: e.target.value })}
        placeholder="Ticket type (e.g. General, VIP, Early Bird)"
        className={inputClasses}
      />
      <div className="flex gap-3">
        <input
          required
          type="number"
          min={1}
          value={draft.priceZar}
          onChange={(e) => setDraft({ ...draft, priceZar: e.target.value ? Number(e.target.value) : "" })}
          placeholder="Price (ZAR)"
          className={`${inputClasses} flex-1`}
        />
        <input
          type="number"
          min={1}
          value={draft.totalQuantity}
          onChange={(e) => setDraft({ ...draft, totalQuantity: e.target.value ? Number(e.target.value) : "" })}
          placeholder="Quantity available"
          className={`${inputClasses} flex-1`}
        />
      </div>
      <input
        value={draft.image}
        onChange={(e) => setDraft({ ...draft, image: e.target.value })}
        placeholder="Poster image URL (optional)"
        className={inputClasses}
      />

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-primary text-white font-heading font-bold text-lg rounded-pill py-3.5 mt-1 shadow-sm active:scale-[0.99] transition-transform disabled:opacity-50"
      >
        List tickets
      </button>
    </form>
  );
}
