"""
Fimiya backend API — FastAPI + SQLite demo data layer (backend/db/fimiya_demo.db,
built by db/create_demo_db.py; see db.py for the DATABASE_URL override used in
production against PostgreSQL / db/schema.sql).

Run:
    python db/create_demo_db.py   # once, to build the demo DB
    uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from routers import artists, auth, bookings, chat, contracts, events, organizers, payments, wallet

app = FastAPI(
    title="Fimiya API",
    description="Discovery, booking, contract and escrow-payment API for the Ekse — Shine Yakithi platform.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    # Both hostnames the frontend dev server answers on — the browser treats
    # localhost and 127.0.0.1 as different origins even though they're the
    # same machine, so a client-side fetch (e.g. the Wallet page, which
    # needs the caller's JWT) silently fails CORS if only one is allowed.
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(artists.router)
app.include_router(organizers.router)
app.include_router(events.router)
app.include_router(bookings.router)
app.include_router(contracts.router)
app.include_router(payments.router)
app.include_router(chat.router)
app.include_router(wallet.router)


@app.get("/", include_in_schema=False)
def root() -> RedirectResponse:
    return RedirectResponse(url="/docs")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "backend"}
