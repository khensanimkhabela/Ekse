/**
 * Static demo data matching the reference screens (design-reference/).
 * Assumption: only Mpumalanga's towns were specified in the brief; the
 * other 8 provinces get a small, plausible town list of their own so the
 * drill-down flow works everywhere, not just for Mpumalanga.
 *
 * In production this would come from the backend (/artists, /organizers,
 * /events) rather than being hardcoded — see backend/ for the real API.
 */

export const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
] as const;

export type Province = (typeof PROVINCES)[number];

export const TOWNS_BY_PROVINCE: Record<Province, string[]> = {
  "Eastern Cape": ["Gqeberha", "East London", "Mthatha", "Queenstown", "Grahamstown"],
  "Free State": ["Bloemfontein", "Welkom", "Bethlehem", "Sasolburg", "Kroonstad"],
  Gauteng: ["Johannesburg", "Pretoria", "Soweto", "Sandton", "Vanderbijlpark"],
  "KwaZulu-Natal": ["Durban", "Pietermaritzburg", "Newcastle", "Richards Bay", "Ladysmith"],
  Limpopo: ["Polokwane", "Tzaneen", "Thohoyandou", "Mokopane", "Musina"],
  Mpumalanga: ["Barberton", "Ermelo", "Graskop", "Lydenburg", "Mbombela", "Standerton", "Witbank"],
  "North West": ["Rustenburg", "Mahikeng", "Klerksdorp", "Potchefstroom", "Brits"],
  "Northern Cape": ["Kimberley", "Upington", "Springbok", "De Aar", "Kuruman"],
  "Western Cape": ["Cape Town", "Stellenbosch", "George", "Paarl", "Worcester"],
};

export const GENRES = [
  "Classical",
  "House",
  "Hip-Hop",
  "Jazz",
  "Kwaito",
  "Maskandi",
  "Reggae",
  "Afrobeat",
  "Gospel",
  "Amapiano",
] as const;

export const CATEGORIES = ["All", "Music", "Media", "Drama", "Poetry", "Dance", "Art", "Other"] as const;

export const EVENT_TYPES = ["Concerts", "Theatrical Performances", "Stand-up Comedy", "Open Mic"] as const;

// No sub-screens for these exist in the design reference (only the menu
// list itself, design-reference/4cf922c5-artist_page.png) — rendered as
// terminal pills rather than links to avoid dead routes, except the ones
// with a real screen behind them now (app/(app)/profile/create-post, .../protect, .../gig-guide, .../tickets, .../wallet).
export const PROFILE_MENU = [
  { label: "Create new post", icon: "plus" as const, href: "/profile/create-post" },
  { label: "Protect your work", icon: "lock" as const, href: "/profile/protect" },
  { label: "GIG-Guide", href: "/profile/gig-guide" },
  { label: "Tickets", href: "/profile/tickets" },
  { label: "Wallet", icon: "wallet" as const, href: "/profile/wallet" },
];

export type Post = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  caption: string;
  image: string;
  initialLikes: number;
};

export type SeedComment = {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timestamp: string;
};

export const STORIES = [
  { id: "s1", name: "Zee_Water", image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=300&q=80" },
  { id: "s2", name: "Naledi Poetics", image: "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=300&q=80" },
  { id: "s3", name: "MC Vusi", image: "https://images.unsplash.com/photo-1516873240891-4bf014598ab4?w=300&q=80" },
  // Picsum (seeded, always resolves) rather than more pinned Unsplash photo
  // IDs, which can't be verified to exist without a live fetch.
  { id: "s4", name: "Kaylee", image: "https://picsum.photos/seed/ekse-story-4/300/400" },
  { id: "s5", name: "Sipho Strings", image: "https://picsum.photos/seed/ekse-story-5/300/400" },
  { id: "s6", name: "Boitumelo Brush", image: "https://picsum.photos/seed/ekse-story-6/300/400" },
  { id: "s7", name: "Reggae Rebels", image: "https://picsum.photos/seed/ekse-story-7/300/400" },
  { id: "s8", name: "Drama Circle JHB", image: "https://picsum.photos/seed/ekse-story-8/300/400" },
];

export const POSTS: Post[] = [
  {
    id: "p1",
    name: "Zee_Water",
    role: "Singer, Songwriter & Guitarist",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    caption: '"Strumming the strings of my soul, every note a melody, every word a story. 🎸✨ #LifeInLyrics"',
    image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&q=80",
    initialLikes: 128,
  },
  {
    id: "p2",
    name: "MC Vusi",
    role: "MC & Producer",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    caption: '"Joburg nights hit different when the bassline drops. New single out now 🔥 #Amapiano"',
    // Picsum (seeded, always resolves) — the previous pinned Unsplash photo
    // ID here 404'd (caught while verifying the stories slideshow change).
    image: "https://picsum.photos/seed/ekse-post-mc-vusi/800/600",
    initialLikes: 342,
  },
  {
    id: "p3",
    name: "Naledi Poetics",
    role: "Spoken Word Artist",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80",
    caption: '"Healing is not linear, and neither is my writing. Open mic this Friday. 📖" ',
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80",
    initialLikes: 76,
  },
];

// Demo comments, keyed by post id — shown on the post detail/comments
// screen (app/(app)/post/[postId]) alongside any the user adds themselves
// (see lib/postInteractions.ts, which persists those to localStorage).
export const COMMENTS_BY_POST: Record<string, SeedComment[]> = {
  p1: [
    {
      id: "c1-1",
      author: "Kaylee",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80",
      text: "This gave me chills 😭🎸 the bridge especially",
      timestamp: "2h ago",
    },
    {
      id: "c1-2",
      author: "MC Vusi",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
      text: "We need to collab on something, this tone is unreal",
      timestamp: "1h ago",
    },
    {
      id: "c1-3",
      author: "Sipho Strings",
      avatar: "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=100&q=80",
      text: "Which tuning is this in? Sounds incredible",
      timestamp: "34m ago",
    },
  ],
  p2: [
    {
      id: "c2-1",
      author: "Zee_Water",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
      text: "That bassline goes crazy 🔥🔥",
      timestamp: "5h ago",
    },
    {
      id: "c2-2",
      author: "Naledi Poetics",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80",
      text: "Played this on repeat all night, Joburg needed this",
      timestamp: "3h ago",
    },
    {
      id: "c2-3",
      author: "Boitumelo Brush",
      avatar: "https://picsum.photos/seed/ekse-comment-boitumelo/100/100",
      text: "Cover art for this one on me 👀 let's talk",
      timestamp: "2h ago",
    },
    {
      id: "c2-4",
      author: "Lerato Lens",
      avatar: "https://picsum.photos/seed/ekse-comment-lerato/100/100",
      text: "Shot a clip of the crowd going off to this, sending it over",
      timestamp: "48m ago",
    },
  ],
  p3: [
    {
      id: "c3-1",
      author: "Kaylee",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80",
      text: "\"Healing is not linear\" — needed to hear this today",
      timestamp: "1d ago",
    },
    {
      id: "c3-2",
      author: "Drama Circle JHB",
      avatar: "https://picsum.photos/seed/ekse-comment-drama/100/100",
      text: "Would love to have you read this at our open mic next month",
      timestamp: "20h ago",
    },
  ],
};
