"""
SQLAlchemy ORM models mirroring db/schema.sql (production Postgres DDL) /
db/create_demo_db.py (SQLite dev DDL). Column names and shapes match both;
see backend/db/schema.sql for the authoritative production types.
"""
from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db import Base


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    password_hash: Mapped[str] = mapped_column(String)
    role: Mapped[str] = mapped_column(String)
    full_name: Mapped[str] = mapped_column(String)
    city: Mapped[str | None] = mapped_column(String, nullable=True)
    province: Mapped[str | None] = mapped_column(String, nullable=True)
    preferred_language: Mapped[str] = mapped_column(String, default="en")
    avatar_url: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[str] = mapped_column(String)
    updated_at: Mapped[str] = mapped_column(String)


class Artist(Base):
    __tablename__ = "artists"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    stage_name: Mapped[str] = mapped_column(String)
    category: Mapped[str] = mapped_column(String)
    genres: Mapped[str | None] = mapped_column(String, nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    town: Mapped[str | None] = mapped_column(String, nullable=True)
    province: Mapped[str | None] = mapped_column(String, nullable=True)
    hourly_rate_zar: Mapped[float | None] = mapped_column(Float, nullable=True)
    years_active: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sars_registered: Mapped[bool] = mapped_column(Integer, default=0)
    copyright_registered: Mapped[bool] = mapped_column(Integer, default=0)
    reputation_score: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[str] = mapped_column(String)
    updated_at: Mapped[str] = mapped_column(String)


class Organizer(Base):
    __tablename__ = "organizers"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    organization_name: Mapped[str] = mapped_column(String)
    organizer_type: Mapped[str | None] = mapped_column(String, nullable=True)
    verified: Mapped[bool] = mapped_column(Integer, default=0)
    created_at: Mapped[str] = mapped_column(String)
    updated_at: Mapped[str] = mapped_column(String)


class Event(Base):
    __tablename__ = "events"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    organizer_id: Mapped[str] = mapped_column(String, ForeignKey("organizers.id"))
    title: Mapped[str] = mapped_column(String)
    event_type: Mapped[str | None] = mapped_column(String, nullable=True)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    genre: Mapped[str | None] = mapped_column(String, nullable=True)
    city: Mapped[str] = mapped_column(String)
    province: Mapped[str] = mapped_column(String)
    venue_name: Mapped[str | None] = mapped_column(String, nullable=True)
    budget_zar: Mapped[float | None] = mapped_column(Float, nullable=True)
    event_date: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default="open")


class Booking(Base):
    __tablename__ = "bookings"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    event_id: Mapped[str] = mapped_column(String, ForeignKey("events.id"))
    artist_id: Mapped[str] = mapped_column(String, ForeignKey("artists.id"))
    organizer_id: Mapped[str] = mapped_column(String, ForeignKey("organizers.id"))
    agreed_fee_zar: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String, default="pending")
    booked_at: Mapped[str] = mapped_column(String)
    completed_at: Mapped[str | None] = mapped_column(String, nullable=True)


class Contract(Base):
    __tablename__ = "contracts"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    booking_id: Mapped[str] = mapped_column(String, ForeignKey("bookings.id"), unique=True)
    contract_text: Mapped[str] = mapped_column(Text)
    risk_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    risk_flags: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default="draft")
    created_at: Mapped[str] = mapped_column(String)


class Payment(Base):
    __tablename__ = "payments"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    booking_id: Mapped[str] = mapped_column(String, ForeignKey("bookings.id"))
    amount_zar: Mapped[float] = mapped_column(Float)
    commission_zar: Mapped[float] = mapped_column(Float, default=0)
    payment_gateway: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="held_in_escrow")
    held_at: Mapped[str | None] = mapped_column(String, nullable=True)
    released_at: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[str] = mapped_column(String)


class Review(Base):
    __tablename__ = "reviews"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    booking_id: Mapped[str] = mapped_column(String, ForeignKey("bookings.id"))
    reviewer_user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    rating: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    sentiment_score: Mapped[float | None] = mapped_column(Float, nullable=True)
