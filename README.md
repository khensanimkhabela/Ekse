# Ekse, Shine Yakithi.

**An AI-powered creative economy platform for South African artists.**

> Empowering creators to thrive by breaking barriers, building community, and ensuring fair
> access to tools, opportunities, and income.

See [PITCH.md](PITCH.md) for the one-page investor pitch.

## The problem

South African independent artists struggle to find consistent, paid work and to protect their
rights: 97% struggle to get exposure or gigs, 67% report not getting paid after performing, 80%
have no copyright protection, and 99% sit outside the formal tax system. Organizers, in turn,
have no reliable way to find and vet talent, and no accountability layer when a booking goes
wrong.

Fimiya fixes this with one platform: **discovery → AI contract → escrow payment → tax
compliance → visibility growth**, in the artist's own language.

## Architecture

```
Organizer search query
        │
        ▼
[AI Discovery Engine] ── multilingual NLP + recommendation ranking (ai-services)
        │
        ▼
Organizer selects artist ──▶ [AI Contract Generator] ── drafts + risk-scores contract
        │                                │                (ai-services, called by backend)
        │                                ▼
        │                     Both parties e-sign
        ▼                                │
[Escrow Payment Service] ◀───────────────┘                (backend: payments ledger)
        │
        ▼
Event happens ──▶ Milestone confirmed ──▶ Payout released (minus commission)
        │
        ▼
[Sentiment Analysis] on post-event feedback ──▶ updates artist reputation score
        │
        ▼
Reputation + engagement data feeds back into the Recommendation Engine.
```

## Monorepo layout

```
Ekse/
├── frontend/         Next.js 14 (App Router) + TypeScript + Tailwind — matches /design-reference
├── backend/           FastAPI — artists/organizers/events/bookings/contracts/payments API
│   └── db/            schema.sql (Postgres DDL) + create_demo_db.py (SQLite demo data layer)
├── ai-services/       FastAPI — the 5 AI features, each a clearly-marked stub (see below)
├── infra/              docker-compose.yml wiring all of the above + Postgres + Redis
├── design-reference/  Reference screens + design-tokens.css (single source of truth for color)
├── PITCH.md            One-page investor pitch
└── README.md           This file
```

## Running it

**1. Demo database** (builds `backend/db/fimiya_demo.db` with realistic South African sample
data — artists/organizers across Johannesburg, Cape Town, Durban & Pretoria — and prints proof
of an end-to-end organizer → booking → artist → payment join):

```bash
cd backend
python -m venv .venv && .venv/Scripts/activate   # or source .venv/bin/activate on macOS/Linux
pip install -r requirements.txt
python db/create_demo_db.py
```

**2. AI services** (port 8001):

```bash
cd ai-services
python -m venv .venv && .venv/Scripts/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

**3. Backend API** (port 8000, docs at `/docs`):

```bash
cd backend
uvicorn main:app --reload --port 8000
```

**4. Frontend** (port 3000):

```bash
cd frontend
npm install
npm run dev
```

**Or all at once with Docker:**

```bash
cd infra
cp .env.example .env
docker compose up --build
```

### API endpoints

`POST /auth/register` (role: `artist` or `organizer`), `POST /auth/login`, `GET /auth/me` —
real authentication: bcrypt-hashed passwords, JWT bearer tokens (see `backend/auth.py`).
`GET /artists` (filters: `category`, `town`, `province`, `genre`), `GET /artists/{id}`,
`GET /artists/featured` (Artist of the Week), `GET /organizers`, `GET /organizers/{id}`,
`GET /events` (filters: `province`, `city`, `category`), `GET /events/{id}`,
`GET|POST /bookings` (filters: `artist_id`, `organizer_id`, `status`; POST triggers the AI
Contract Generator + creates the escrow payment), `GET /contracts`, `GET /payments`,
`POST /payments/{id}/release`, **`POST /chat`** (auth required — the AI Chat Assistant; see below).

### AI services endpoints (all stubbed — see below)

`POST /discovery/match`, `POST /contracts/generate`, `POST /tax/estimate`,
`POST /visibility/bio|caption|poster`, `POST /sentiment/analyze`, `POST /fraud/check`,
`POST /chat/classify`, `POST /chat/compose`.

### AI Chat Assistant

Reached via the floating chat button on every screen (bottom-right, `frontend/components/ChatFab.tsx`
→ `app/(app)/assistant`). Answers three kinds of questions, real data all the way through:
- **Bookings** — "what are my bookings?" → the signed-in artist's or organizer's actual bookings.
- **Artist of the Week** — "who's the artist of the week?" → a deterministic weekly rotation among
  the top-5 rated artists (`backend/routers/artists.py`'s `get_artist_of_the_week`; same pick all
  week, changes next week — no dedicated featured-artist table needed for the demo).
- **Events near me** — "any events near me?" → the signed-in user's own city/province, matched
  against `events`.

Split the same way as the rest of the AI features: `ai-services/services/chatbot.py` does the
(stubbed) intent classification + reply composition; `backend/routers/chat.py` owns the actual
DB queries and calls ai-services twice per message (classify → fetch data → compose).

## What's stubbed vs. real

Every AI feature (`ai-services/services/*.py`) is a **clearly-marked stub** — deterministic,
rule-based logic standing in for the real model described in each module's docstring (two-tower
retrieval, RAG-grounded LLM contract generation, SARS-aware tax forecasting, LLM/diffusion
content generation, fine-tuned sentiment/fraud classifiers). The API contract is real and fully
callable; swap the function bodies for real model calls when ready. The backend's booking flow
genuinely calls `ai-services` over HTTP for contract generation (with a local fallback if it's
unreachable) — the workflow in the diagram above runs end-to-end today, just with mocked model
output.

## Assumptions made while building

1. `schema.sql` targets PostgreSQL (per the tech stack); SQLite can't run Postgres DDL directly,
   so `backend/db/create_demo_db.py` defines an equivalent SQLite-flavored schema (mirroring the
   same tables/relationships) rather than executing `schema.sql` literally.
2. The frontend renders from local mock data (`frontend/lib/data.ts`) matching the reference
   screens. Only Mpumalanga's towns were specified in the brief; the other 8 provinces got a
   small, plausible town list of their own (mirrored in `backend/db/create_demo_db.py`'s
   `TOWNS_BY_PROVINCE` — keep both in sync if towns change). Most of the frontend still isn't
   wired to fetch from the backend. **Exceptions, wired to the real backend:**
   - **Login/Signup** (`frontend/lib/auth.ts` → `backend/routers/auth.py`) — genuine bcrypt+JWT
     auth, not a mock. The session is checked client-side on every `(app)` route
     (`components/AuthGuard.tsx`) — signed-out users are redirected to `/login`, and
     `/login`/`/signup` redirect signed-in users to `/`. The JWT/user are kept in localStorage
     (simple, but XSS-exposed — swap for an httpOnly cookie before real production use).
   - **Town → local artists** (`frontend/lib/api.ts` → `GET /artists?town=&province=&genre=`) —
     every town has at least one real seeded artist; see point 7 below.
3. `ai-services` is the canonical home of the 6 stub AI functions (5 original + the chat
   assistant). `backend` calls them over HTTP via `AI_SERVICES_URL`, falling back to an inline
   stub if unreachable, so the backend demo still works standalone. `AI_SERVICES_URL` and every
   frontend `NEXT_PUBLIC_API_URL` default point at `127.0.0.1`, not `localhost` — on this
   Windows dev box, resolving `"localhost"` tried IPv6 first and only fell back to IPv4 after a
   real, measured delay (Python: ~2s/call; Node: ~0.1s/call), and `backend/services/ai_client.py`
   also switched from a one-off `httpx.post()` per call (~1s of pure connection setup each) to a
   single reused, keep-alive `httpx.Client` — together that took the chat assistant from ~5s to
   ~15ms per message. Worth knowing if you deploy somewhere these defaults don't apply.
4. Friends and Messages have no screens in `/design-reference` — built as minimal placeholders
   using the same header / bottom-nav design system.
5. Fonts use a Google Fonts `<link>` (Poppins) with a system-font fallback stack rather than
   `next/font/google`, to avoid a build-time network dependency.
6. `infra/docker-compose.yml` provisions Postgres + Redis to match the production target stack,
   but `backend`/`ai-services` run against the committed SQLite demo DB by default — switch
   `DATABASE_URL` (see `infra/.env.example`) once you're ready to run against Postgres.
7. The demo artist roster (`backend/db/create_demo_db.py`) has 53 artists — 10 hand-written
   "flagship" profiles plus one deterministically-generated artist per remaining town (seeded
   RNG, so the roster is identical on every rebuild), so every town has at least one local
   artist to show on its Town Artists page. Names are drawn from isiZulu, isiXhosa, Sesotho,
   Setswana, Tsonga and Venda naming traditions, representing South Africa's Black artists per
   the brief; avatars are initials badges rather than stock photos, to avoid attaching
   arbitrary stock imagery to fictional names.
8. `npm audit` flags advisories against a broad range of Next.js versions (mostly edge/SSR/
   middleware attack surfaces); pinned to the latest patched Next 14.2.x line rather than jumping
   to Next 16 mid-scaffold. Worth revisiting before any real deployment.

## ⚠️ Git repository scope

This project's `.git` is **not** scoped to this folder — it's rooted at the Windows user profile
(`C:/Users/jabul`), tracking the entire home directory (including `AppData`, `NTUSER.DAT`,
`.ssh/`, and unrelated personal/school projects), with remotes pointing at public GitHub repos.
No git commands were run as part of this build. **Before committing anything from this project,**
either `git init` a repo scoped to this `Ekse/` folder specifically, or otherwise untangle the
profile-wide repo — committing from here as-is risks pushing personal files to a public remote.
