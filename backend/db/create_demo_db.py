#!/usr/bin/env python3
"""
Fimiya (Ekse — Shine Yakithi) — local demo database builder.

Builds a SQLite copy of the schema described in schema.sql (Postgres DDL,
adapted to SQLite types: SERIAL/UUID -> TEXT primary key, JSONB/ARRAY ->
TEXT, TIMESTAMPTZ -> TEXT) and seeds it with realistic South African sample
data: artists & organizers across Johannesburg, Cape Town, Durban and
Pretoria, plus bookings, contracts, escrow payments, reviews and tax
estimates.

Usage:
    python backend/db/create_demo_db.py

Run from any directory — output DB path is always backend/db/fimiya_demo.db
(this file's directory), and the backend API (backend/db.py) points here by
default via DATABASE_URL.

At the end it prints a row count per table and one sample joined query
(organizer -> booking -> artist -> payment status) to prove the schema
works end-to-end.
"""
import random
import sqlite3
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "fimiya_demo.db"

SCHEMA = """
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('artist','organizer','admin')),
    full_name TEXT NOT NULL,
    city TEXT,
    province TEXT,
    preferred_language TEXT DEFAULT 'en',
    avatar_url TEXT,
    consent_given_at TEXT,
    marketing_opt_in INTEGER NOT NULL DEFAULT 0,
    data_retention_until TEXT,
    deleted_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE artists (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    stage_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('music','media','drama','poetry','dance','art','other')),
    genres TEXT,              -- comma-separated (ARRAY in Postgres)
    bio TEXT,
    town TEXT,                -- denormalized from users.city for direct town-page lookups
    province TEXT,            -- denormalized from users.province, same reason
    hourly_rate_zar REAL,
    years_active INTEGER,
    sars_registered INTEGER NOT NULL DEFAULT 0,
    copyright_registered INTEGER NOT NULL DEFAULT 0,
    reputation_score REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE organizers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    organization_name TEXT NOT NULL,
    organizer_type TEXT CHECK (organizer_type IN ('venue','promoter','brand','individual')),
    verified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE portfolios (
    id TEXT PRIMARY KEY,
    artist_id TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    title TEXT,
    caption TEXT,
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image','video','audio')),
    is_public INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
);

CREATE TABLE events (
    id TEXT PRIMARY KEY,
    organizer_id TEXT NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    event_type TEXT CHECK (event_type IN ('concert','theatrical_performance','stand_up_comedy','open_mic','other')),
    category TEXT CHECK (category IN ('music','media','drama','poetry','dance','art','other')),
    genre TEXT,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    venue_name TEXT,
    budget_zar REAL,
    event_date TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','booked','completed','cancelled')),
    created_at TEXT NOT NULL
);

CREATE TABLE bookings (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    artist_id TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    organizer_id TEXT NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
    agreed_fee_zar REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled','disputed')),
    booked_at TEXT NOT NULL,
    completed_at TEXT
);

CREATE TABLE contracts (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    contract_text TEXT NOT NULL,
    risk_score REAL,
    risk_flags TEXT,
    artist_signed_at TEXT,
    organizer_signed_at TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','signed','voided')),
    created_at TEXT NOT NULL
);

CREATE TABLE payments (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount_zar REAL NOT NULL,
    commission_zar REAL NOT NULL DEFAULT 0,
    payment_gateway TEXT CHECK (payment_gateway IN ('payfast','ozow','yoco','stripe')),
    status TEXT NOT NULL DEFAULT 'held_in_escrow' CHECK (status IN ('pending','held_in_escrow','released','refunded','failed')),
    held_at TEXT,
    released_at TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE reviews (
    id TEXT PRIMARY KEY,
    booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    reviewer_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    sentiment_score REAL,
    created_at TEXT NOT NULL
);

CREATE TABLE tax_estimates (
    id TEXT PRIMARY KEY,
    artist_id TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    gross_income_zar REAL NOT NULL DEFAULT 0,
    estimated_expenses_zar REAL NOT NULL DEFAULT 0,
    estimated_tax_zar REAL NOT NULL DEFAULT 0,
    sars_filing_due TEXT,
    generated_at TEXT NOT NULL
);
"""

def uid() -> str:
    return str(uuid.uuid4())

def now() -> str:
    return datetime.now(timezone.utc).isoformat()

# --- Seed data: South African artists & organizers -----------------------

# Keep in sync with frontend/lib/data.ts TOWNS_BY_PROVINCE — town names must
# match exactly, since the frontend passes them straight through as the
# ?town= filter on GET /artists (see backend/routers/artists.py).
TOWNS_BY_PROVINCE = {
    "Eastern Cape": ["Gqeberha", "East London", "Mthatha", "Queenstown", "Grahamstown"],
    "Free State": ["Bloemfontein", "Welkom", "Bethlehem", "Sasolburg", "Kroonstad"],
    "Gauteng": ["Johannesburg", "Pretoria", "Soweto", "Sandton", "Vanderbijlpark"],
    "KwaZulu-Natal": ["Durban", "Pietermaritzburg", "Newcastle", "Richards Bay", "Ladysmith"],
    "Limpopo": ["Polokwane", "Tzaneen", "Thohoyandou", "Mokopane", "Musina"],
    "Mpumalanga": ["Barberton", "Ermelo", "Graskop", "Lydenburg", "Mbombela", "Standerton", "Witbank"],
    "North West": ["Rustenburg", "Mahikeng", "Klerksdorp", "Potchefstroom", "Brits"],
    "Northern Cape": ["Kimberley", "Upington", "Springbok", "De Aar", "Kuruman"],
    "Western Cape": ["Cape Town", "Stellenbosch", "George", "Paarl", "Worcester"],
}

# Flagship, hand-written artists (richer bios) for the biggest towns.
# stage_name, full_name, category, genres, town, province, bio, rate, years
FLAGSHIP_ARTISTS = [
    ("Zee_Water", "Thandeka Zulu", "music", "Jazz,Kwaito", "Durban", "KwaZulu-Natal",
     "Singer, Songwriter & Guitarist. Strumming the strings of my soul.", 850, 6),
    ("MC Vusi", "Vusi Mahlangu", "music", "Hip-Hop,House", "Johannesburg", "Gauteng",
     "MC and producer bringing Joburg energy to every stage.", 1200, 8),
    ("Naledi Poetics", "Naledi Mokoena", "poetry", "Spoken Word", "Pretoria", "Gauteng",
     "Spoken word artist exploring identity and healing.", 600, 4),
    ("Kaylee", "Kaylee Adams", "poetry", "Spoken Word,Storytelling", "Cape Town", "Western Cape",
     "Artist & poet. Words as a form of resistance and joy.", 700, 3),
    ("Sipho Strings", "Sipho Ndlovu", "music", "Maskandi,Classical", "Durban", "KwaZulu-Natal",
     "Traditional Maskandi guitarist, 3rd generation musician.", 900, 12),
    ("The Cape Flats Collective", "Amantle Jacobs", "dance", "Contemporary,Gumboot", "Cape Town", "Western Cape",
     "Dance crew blending contemporary and gumboot traditions.", 1500, 7),
    ("Lerato Lens", "Lerato Sithole", "media", "Photography,Film", "Johannesburg", "Gauteng",
     "Visual storyteller documenting township life.", 1100, 5),
    ("Boitumelo Brush", "Boitumelo Khumalo", "art", "Mural,Illustration", "Pretoria", "Gauteng",
     "Muralist turning public walls into community canvases.", 950, 9),
    ("Reggae Rebels", "Themba Ngwenya", "music", "Reggae", "Durban", "KwaZulu-Natal",
     "4-piece reggae band with a message of unity.", 1800, 10),
    ("Drama Circle JHB", "Nomvula Radebe", "drama", "Theatre,Comedy", "Johannesburg", "Gauteng",
     "Theatrical troupe staging original South African stories.", 2000, 11),
]

# Name pool used to generate the rest of the roster — every town in
# TOWNS_BY_PROVINCE gets at least one artist so "artists in this town" never
# comes up empty. Names drawn from isiZulu, isiXhosa, Sesotho, Setswana,
# Tsonga and Venda naming traditions, representing South Africa's Black
# artists (per the brief).
FIRST_NAMES = [
    "Thabo", "Sipho", "Nomvula", "Lindiwe", "Bongani", "Zanele", "Andile", "Ayanda",
    "Katlego", "Lerato", "Tshepo", "Refilwe", "Kagiso", "Palesa", "Sibusiso", "Nomsa",
    "Mandla", "Thandeka", "Vuyo", "Nokuthula", "Themba", "Busisiwe", "Lwazi", "Naledi",
    "Karabo", "Boitumelo", "Sizwe", "Zodwa", "Musa", "Ntombi", "Thulani", "Precious",
    "Ndumiso", "Amahle", "Siyabonga", "Nosipho", "Lungile", "Khanyisile", "Mpho", "Dumisani",
    "Fikile", "Sibongile", "Mbali", "Xolani", "Nolwazi", "Zinhle", "Tumelo", "Rethabile",
    "Kabelo", "Onthatile",
]
SURNAMES = [
    "Mokoena", "Ndlovu", "Khumalo", "Dlamini", "Nkosi", "Zulu", "Mahlangu", "Sithole",
    "Radebe", "Mabaso", "Cele", "Mthembu", "Gumede", "Buthelezi", "Nxumalo", "Mokgatla",
    "Tshabalala", "Mokwena", "Molefe", "Sepuru", "Mabena", "Maseko", "Ngwenya", "Motaung",
    "Selepe", "Modise", "Mahlaba", "Baloyi", "Chauke", "Ravele", "Mudau", "Bhengu", "Mpofu",
]
CATEGORY_CYCLE = ["music", "poetry", "dance", "art", "drama", "media", "other"]
CATEGORY_GENRES = {
    "music": ["Classical", "House", "Hip-Hop", "Jazz", "Kwaito", "Maskandi", "Reggae", "Afrobeat", "Gospel", "Amapiano"],
    "poetry": ["Spoken Word", "Storytelling", "Praise Poetry"],
    "dance": ["Contemporary", "Gumboot", "Pantsula", "Isicathamiya"],
    "art": ["Mural", "Illustration", "Sculpture", "Beadwork"],
    "drama": ["Theatre", "Comedy", "Improv"],
    "media": ["Photography", "Film", "Podcasting"],
    "other": ["Fashion Design", "Culinary Arts", "Crafts"],
}
STAGE_SUFFIX = {
    "music": ["Beats", "Vibes", "Sound", "Rhythm", "Grooves"],
    "poetry": ["Poetics", "Verses", "Words"],
    "dance": ["Moves", "Steps", "Motion"],
    "art": ["Brush", "Canvas", "Ink"],
    "drama": ["Theatrics", "Stage", "Scenes"],
    "media": ["Lens", "Frames", "Studio"],
    "other": ["Creative", "Studio", "Collective"],
}
BIO_TEMPLATES = [
    "Rising {category} talent from {town}, blending tradition with a modern edge.",
    "{town}-based {category} artist known for {genre} that moves crowds.",
    "Homegrown {town} creative making waves in the local {category} scene.",
    "Building a name in {province}'s {category} scene, straight out of {town}.",
]


def _generate_artist(rng: random.Random, town: str, province: str, category: str) -> tuple:
    first = rng.choice(FIRST_NAMES)
    surname = rng.choice(SURNAMES)
    full_name = f"{first} {surname}"
    stage_name = f"{first} {rng.choice(STAGE_SUFFIX[category])}"
    genre_pool = CATEGORY_GENRES[category]
    genres = ", ".join(rng.sample(genre_pool, k=min(2, len(genre_pool))))
    bio = rng.choice(BIO_TEMPLATES).format(
        town=town, category=category, genre=genres.split(",")[0].strip(), province=province
    )
    rate = rng.choice([450, 550, 650, 750, 850, 950, 1050])
    years = rng.randint(1, 12)
    return (stage_name, full_name, category, genres, town, province, bio, rate, years)


def build_artist_roster() -> list[tuple]:
    """Flagship artists for the biggest towns + one generated artist per
    remaining town, so every town in TOWNS_BY_PROVINCE has at least one
    local artist. Seeded RNG -> same roster every run."""
    rng = random.Random(42)
    roster = list(FLAGSHIP_ARTISTS)
    covered_towns = {a[4] for a in FLAGSHIP_ARTISTS}

    category_i = 0
    for province, towns in TOWNS_BY_PROVINCE.items():
        for town in towns:
            if town in covered_towns:
                continue
            category = CATEGORY_CYCLE[category_i % len(CATEGORY_CYCLE)]
            category_i += 1
            roster.append(_generate_artist(rng, town, province, category))
    return roster


ARTISTS = build_artist_roster()

ORGANIZERS = [
    ("Bassline Fest", "venue", "Johannesburg", "Gauteng"),
    ("Cape Town Live Sessions", "promoter", "Cape Town", "Western Cape"),
    ("Durban Nights Entertainment", "promoter", "Durban", "KwaZulu-Natal"),
    ("Tshwane Arts Council", "brand", "Pretoria", "Gauteng"),
    ("Ekse Community Events", "individual", "Johannesburg", "Gauteng"),
]

EVENT_TYPES = ["concert", "theatrical_performance", "stand_up_comedy", "open_mic"]
GATEWAYS = ["payfast", "ozow", "yoco"]


def seed(conn: sqlite3.Connection) -> None:
    cur = conn.cursor()
    ts = now()

    artist_ids = []
    for artist_index, (stage_name, full_name, category, genres, town, province, bio, rate, years) in enumerate(ARTISTS):
        user_id = uid()
        email_slug = stage_name.lower().replace(" ", ".").replace("_", ".")
        cur.execute(
            "INSERT INTO users (id,email,phone,password_hash,role,full_name,city,province,"
            "preferred_language,avatar_url,consent_given_at,marketing_opt_in,data_retention_until,"
            "deleted_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (user_id, f"{email_slug}.{artist_index}@fimiya.demo", "+27" + "8" + str(abs(hash(stage_name)) % 100000000).zfill(8),
             "demo_hash_not_real", "artist", full_name, town, province, "en", None, ts, 1, None, None, ts, ts),
        )
        artist_id = uid()
        cur.execute(
            "INSERT INTO artists (id,user_id,stage_name,category,genres,bio,town,province,hourly_rate_zar,"
            "years_active,sars_registered,copyright_registered,reputation_score,created_at,updated_at) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (artist_id, user_id, stage_name, category, genres, bio, town, province, rate, years, 0, 0,
             round(3.5 + (years % 5) * 0.25, 2), ts, ts),
        )
        artist_ids.append((artist_id, town, province, category, genres.split(",")[0]))

    organizer_ids = []
    for org_name, org_type, city, province in ORGANIZERS:
        user_id = uid()
        cur.execute(
            "INSERT INTO users (id,email,phone,password_hash,role,full_name,city,province,"
            "preferred_language,avatar_url,consent_given_at,marketing_opt_in,data_retention_until,"
            "deleted_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (user_id, f"{org_name.lower().replace(' ', '.')}@fimiya.demo", "+27110000000",
             "demo_hash_not_real", "organizer", org_name, city, province, "en", None, ts, 1, None, None, ts, ts),
        )
        organizer_id = uid()
        cur.execute(
            "INSERT INTO organizers (id,user_id,organization_name,organizer_type,verified,created_at,updated_at) "
            "VALUES (?,?,?,?,?,?,?)",
            (organizer_id, user_id, org_name, org_type, 1, ts, ts),
        )
        organizer_ids.append((organizer_id, city, province))

    # Events, one or two per organizer
    event_rows = []
    for i, (organizer_id, city, province) in enumerate(organizer_ids):
        for j in range(2):
            event_id = uid()
            etype = EVENT_TYPES[(i + j) % len(EVENT_TYPES)]
            _, _, _, category, genre = artist_ids[(i + j) % len(artist_ids)]
            event_date = (date.today() + timedelta(days=14 * (i + j + 1))).isoformat()
            cur.execute(
                "INSERT INTO events (id,organizer_id,title,event_type,category,genre,city,province,"
                "venue_name,budget_zar,event_date,description,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (event_id, organizer_id, f"{ORGANIZERS[i][0]} presents: Night {j+1}", etype, category, genre,
                 city, province, f"{city} Hall", 5000 + (i * 500), event_date,
                 "AI-matched lineup, escrow-protected booking.", "open", ts),
            )
            event_rows.append((event_id, organizer_id, city))

    # Bookings + contracts + payments + reviews for a subset of events
    booking_count = 0
    for idx, (event_id, organizer_id, city) in enumerate(event_rows):
        if idx % 2 != 0:
            continue  # only book every other event, leave some "open"
        artist_id, a_city, a_province, category, genre = artist_ids[idx % len(artist_ids)]
        booking_id = uid()
        fee = 2500 + (idx * 150)
        status = "completed" if idx % 4 == 0 else "confirmed"
        cur.execute(
            "INSERT INTO bookings (id,event_id,artist_id,organizer_id,agreed_fee_zar,status,booked_at,completed_at) "
            "VALUES (?,?,?,?,?,?,?,?)",
            (booking_id, event_id, artist_id, organizer_id, fee, status, ts,
             ts if status == "completed" else None),
        )
        cur.execute("UPDATE events SET status='booked' WHERE id=?", (event_id,))

        contract_id = uid()
        cur.execute(
            "INSERT INTO contracts (id,booking_id,contract_text,risk_score,risk_flags,artist_signed_at,"
            "organizer_signed_at,status,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
            (contract_id, booking_id,
             f"Performance agreement between organizer and artist for fee R{fee}. "
             "Standard SA entertainment-industry clauses apply (cancellation, force majeure, payout terms).",
             round(0.1 + (idx % 3) * 0.1, 2), "" if idx % 3 else "no explicit cancellation window",
             ts, ts, "signed", ts),
        )

        payment_id = uid()
        commission = round(fee * 0.15, 2)
        pay_status = "released" if status == "completed" else "held_in_escrow"
        cur.execute(
            "INSERT INTO payments (id,booking_id,amount_zar,commission_zar,payment_gateway,status,held_at,"
            "released_at,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
            (payment_id, booking_id, fee, commission, GATEWAYS[idx % len(GATEWAYS)], pay_status, ts,
             ts if pay_status == "released" else None, ts),
        )

        if status == "completed":
            review_id = uid()
            cur.execute(
                "INSERT INTO reviews (id,booking_id,reviewer_user_id,rating,comment,sentiment_score,created_at) "
                "VALUES (?,?,?,?,?,?,?)",
                (review_id, booking_id, uid(), 5, "Incredible performance, booked again next month!", 0.92, ts),
            )
        booking_count += 1

    # Tax estimates for each artist (one period)
    for artist_id, city, province, category, genre in artist_ids:
        cur.execute(
            "INSERT INTO tax_estimates (id,artist_id,period_start,period_end,gross_income_zar,"
            "estimated_expenses_zar,estimated_tax_zar,sars_filing_due,generated_at) VALUES (?,?,?,?,?,?,?,?,?)",
            (uid(), artist_id, "2026-03-01", "2026-08-31", 42000, 9500, 5175, "2027-01-31", ts),
        )

    conn.commit()
    return booking_count


def main() -> None:
    if DB_PATH.exists():
        DB_PATH.unlink()
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(SCHEMA)
    booking_count = seed(conn)

    print(f"Fimiya demo database created at: {DB_PATH}")
    print("=" * 60)

    tables = ["users", "artists", "organizers", "portfolios", "events", "bookings",
              "contracts", "payments", "reviews", "tax_estimates"]
    for t in tables:
        n = conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        print(f"  {t:<16} {n:>4} rows")
    print("=" * 60)

    print("\nSample joined query — organizer -> booking -> artist -> payment status:\n")
    rows = conn.execute(
        """
        SELECT o.organization_name AS organizer,
               a.stage_name        AS artist,
               e.title             AS event,
               b.agreed_fee_zar    AS fee_zar,
               b.status            AS booking_status,
               p.status            AS payment_status
        FROM bookings b
        JOIN organizers o ON o.id = b.organizer_id
        JOIN artists a    ON a.id = b.artist_id
        JOIN events e     ON e.id = b.event_id
        JOIN payments p   ON p.booking_id = b.id
        ORDER BY e.event_date
        """
    ).fetchall()

    header = f"{'Organizer':<26} {'Artist':<18} {'Event':<32} {'Fee (R)':>8} {'Booking':<11} {'Payment'}"
    print(header)
    print("-" * len(header))
    for organizer, artist, event, fee, bstatus, pstatus in rows:
        print(f"{organizer:<26} {artist:<18} {event:<32} {fee:>8.2f} {bstatus:<11} {pstatus}")

    print(f"\n{len(rows)} booking(s) proven end-to-end (of {booking_count} created).")
    conn.close()


if __name__ == "__main__":
    main()
