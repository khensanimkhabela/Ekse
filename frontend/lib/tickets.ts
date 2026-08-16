/**
 * Event ticketing — a shared "marketplace" of ticket listings that any
 * signed-in user (artist or organizer — symmetric access, unlike Gig
 * Guide) can add to, and anyone can buy from. No backend `tickets` table
 * exists yet, so this is a genuinely-working, localStorage-backed layer:
 * listings are shared globally (one browser = one "instance" of the
 * marketplace), purchases are kept per-user so "My Tickets" only shows
 * what that signed-in user bought.
 */
export type TicketListing = {
  id: string;
  eventTitle: string;
  venue: string;
  city: string;
  date: string; // YYYY-MM-DD
  time?: string;
  ticketType: string; // e.g. "General", "VIP", "Early Bird"
  priceZar: number;
  totalQuantity: number;
  image: string;
  addedByName: string;
};

export type PurchasedTicket = {
  id: string;
  listingId: string;
  eventTitle: string;
  venue: string;
  city: string;
  date: string;
  time?: string;
  ticketType: string;
  priceZar: number;
  quantity: number;
  buyerName: string;
  purchasedAt: string;
};

const LISTINGS_KEY = "fimiya_ticket_listings";
const PURCHASES_KEY_PREFIX = "fimiya_my_tickets_";

function isoDate(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
}

function seedListings(): TicketListing[] {
  return [
    {
      id: "listing-1",
      eventTitle: "Bassline Fest — Night 1",
      venue: "Bassline Fest",
      city: "Johannesburg",
      date: isoDate(20),
      time: "19:00",
      ticketType: "General",
      priceZar: 250,
      totalQuantity: 200,
      image: "/tickets/bassline-fest.jpg",
      addedByName: "Bassline Fest",
    },
    {
      id: "listing-2",
      eventTitle: "Bassline Fest — Night 1",
      venue: "Bassline Fest",
      city: "Johannesburg",
      date: isoDate(20),
      time: "19:00",
      ticketType: "VIP",
      priceZar: 550,
      totalQuantity: 50,
      image: "/tickets/bassline-fest.jpg",
      addedByName: "Bassline Fest",
    },
    {
      id: "listing-3",
      eventTitle: "Durban Nights — Chill Room Set",
      venue: "Chill Room",
      city: "Durban",
      date: isoDate(12),
      time: "21:00",
      ticketType: "General",
      priceZar: 180,
      totalQuantity: 120,
      image: "/tickets/durban-night.webp",
      addedByName: "Durban Nights Entertainment",
    },
    {
      id: "listing-4",
      eventTitle: "Cape Town Live Sessions",
      venue: "The Fringe",
      city: "Cape Town",
      date: isoDate(30),
      time: "18:30",
      ticketType: "Early Bird",
      priceZar: 150,
      totalQuantity: 80,
      image: "/tickets/capetown-live-session.jpg",
      addedByName: "Cape Town Live Sessions",
    },
    {
      id: "listing-5",
      eventTitle: "Tshwane Arts Council — Open Mic",
      venue: "Tshwane Arts Council",
      city: "Pretoria",
      date: isoDate(8),
      time: "19:30",
      ticketType: "General",
      priceZar: 100,
      totalQuantity: 60,
      image: "/tickets/tshwane-arts-council.jpg",
      addedByName: "Tshwane Arts Council",
    },
  ];
}

// Seed listing ids -> their current image. Browsers that already cached
// listings before these real event photos were added (or before an image
// changed) would otherwise keep showing the old picsum placeholder
// forever, since getListings() only seeds when nothing is stored yet.
// getListings() patches exactly these ids on every load — anything the
// user added themselves (a different id) is left untouched.
const SEED_IMAGE_BY_ID: Record<string, string> = {
  "listing-1": "/tickets/bassline-fest.jpg",
  "listing-2": "/tickets/bassline-fest.jpg",
  "listing-3": "/tickets/durban-night.webp",
  "listing-4": "/tickets/capetown-live-session.jpg",
  "listing-5": "/tickets/tshwane-arts-council.jpg",
};

export function getListings(): TicketListing[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LISTINGS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as TicketListing[];
      let changed = false;
      const migrated = parsed.map((listing) => {
        const currentImage = SEED_IMAGE_BY_ID[listing.id];
        if (currentImage && listing.image !== currentImage) {
          changed = true;
          return { ...listing, image: currentImage };
        }
        return listing;
      });
      if (changed) localStorage.setItem(LISTINGS_KEY, JSON.stringify(migrated));
      return migrated;
    } catch {
      // fall through and reseed a corrupted value
    }
  }
  const seeded = seedListings();
  localStorage.setItem(LISTINGS_KEY, JSON.stringify(seeded));
  return seeded;
}

export function addListing(listing: TicketListing): TicketListing[] {
  const listings = getListings();
  listings.unshift(listing);
  localStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));
  return listings;
}

function purchasesKey(userId: string): string {
  return `${PURCHASES_KEY_PREFIX}${userId}`;
}

export function getMyTickets(userId: string): PurchasedTicket[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(purchasesKey(userId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PurchasedTicket[];
  } catch {
    return [];
  }
}

export function buyTicket(userId: string, ticket: PurchasedTicket): PurchasedTicket[] {
  const tickets = getMyTickets(userId);
  tickets.unshift(ticket);
  localStorage.setItem(purchasesKey(userId), JSON.stringify(tickets));
  return tickets;
}
