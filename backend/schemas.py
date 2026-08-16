"""Pydantic request/response schemas for the Fimiya backend API."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ArtistOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    stage_name: str
    category: str
    genres: str | None = None
    bio: str | None = None
    town: str | None = None
    province: str | None = None
    hourly_rate_zar: float | None = None
    years_active: int | None = None
    reputation_score: float


class OrganizerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    organization_name: str
    organizer_type: str | None = None
    verified: bool


class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    organizer_id: str
    title: str
    event_type: str | None = None
    category: str | None = None
    genre: str | None = None
    city: str
    province: str
    venue_name: str | None = None
    budget_zar: float | None = None
    event_date: str
    status: str


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    event_id: str
    artist_id: str
    organizer_id: str
    agreed_fee_zar: float
    status: str
    booked_at: str
    completed_at: str | None = None


class BookingCreate(BaseModel):
    event_id: str
    artist_id: str
    organizer_id: str
    agreed_fee_zar: float


class ContractOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    booking_id: str
    contract_text: str
    risk_score: float | None = None
    risk_flags: str | None = None
    status: str
    created_at: str


class BookingWithContractOut(BaseModel):
    booking: BookingOut
    contract: ContractOut


class ContractDraftRequest(BaseModel):
    artist_name: str
    organizer_name: str
    event_title: str
    event_date: str
    fee_zar: float
    city: str | None = None


class ContractDraftOut(BaseModel):
    contract_text: str
    risk_score: float
    risk_flags: list[str]
    market_rate_note: str


class RegisterRequest(BaseModel):
    role: Literal["artist", "organizer"]
    email: str
    password: str = Field(min_length=8)
    full_name: str
    city: str | None = None
    province: str | None = None
    phone: str | None = None
    # artist-only
    stage_name: str | None = None
    category: str | None = None
    genres: str | None = None
    bio: str | None = None
    # organizer-only
    organization_name: str | None = None
    organizer_type: str | None = None

    @field_validator("email")
    @classmethod
    def email_looks_valid(cls, v: str) -> str:
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("must be a valid email address")
        return v.lower()


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthUserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    artist_id: str | None = None
    organizer_id: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserOut


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    booking_id: str
    amount_zar: float
    commission_zar: float
    payment_gateway: str | None = None
    status: str
    held_at: str | None = None
    released_at: str | None = None


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


class ChatResponse(BaseModel):
    reply: str
    intent: Literal["bookings", "artist_of_week", "events_near_me", "general"]
    detected_language: str
    data: dict


class WalletTransaction(BaseModel):
    id: str
    event_title: str
    amount_zar: float  # net to the artist (amount_zar - commission_zar)
    gross_zar: float
    commission_zar: float
    status: str
    date: str


class WalletOut(BaseModel):
    earned_zar: float  # released payments, net of commission
    pending_zar: float  # held_in_escrow + pending payments, net of commission
    total_revenue_zar: float  # earned + pending
    estimated_tax_zar: float  # from the AI Tax Assistant (services/ai_client.py), real earnings in
    taxable_income_zar: float
    effective_tax_rate_pct: float
    sars_filing_due: str
    completed_bookings: int
    pending_bookings: int
    transactions: list[WalletTransaction]
