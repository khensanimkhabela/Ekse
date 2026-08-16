-- =====================================================================
-- Fimiya (Ekse — Shine Yakithi) — Production schema (PostgreSQL)
--
-- Mirrors Section 5.1 of the master build prompt: users, artists,
-- organizers, portfolios, events, bookings, contracts, payments (escrow
-- ledger), reviews, tax_estimates.
--
-- NOTE: backend/db/create_demo_db.py does NOT execute this file — SQLite
-- (used for the local demo/dev data layer) can't run Postgres DDL
-- (SERIAL, UUID, JSONB, CHECK-enums, etc). create_demo_db.py defines an
-- equivalent SQLite-flavored schema that mirrors these same tables and
-- relationships. This file is the source of truth for production.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- users — base identity for both artists and organizers (role-based)
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email               VARCHAR(255) NOT NULL UNIQUE,
    phone               VARCHAR(32),
    password_hash       VARCHAR(255) NOT NULL,
    role                VARCHAR(16) NOT NULL CHECK (role IN ('artist', 'organizer', 'admin')),
    full_name           VARCHAR(255) NOT NULL,
    city                VARCHAR(120),
    province             VARCHAR(120),
    preferred_language  VARCHAR(8) DEFAULT 'en', -- en, zu, xh, af, st
    avatar_url          TEXT,
    -- POPIA compliance fields
    consent_given_at    TIMESTAMPTZ,
    marketing_opt_in    BOOLEAN NOT NULL DEFAULT FALSE,
    data_retention_until DATE,
    deleted_at          TIMESTAMPTZ, -- soft delete for right-to-be-forgotten
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- artists — artist-specific profile data
-- ---------------------------------------------------------------------
CREATE TABLE artists (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    stage_name          VARCHAR(120) NOT NULL,
    category            VARCHAR(32) NOT NULL CHECK (category IN
                          ('music', 'media', 'drama', 'poetry', 'dance', 'art', 'other')),
    genres              TEXT[],              -- e.g. {'Jazz','Kwaito'}
    bio                 TEXT,
    town                VARCHAR(120),        -- denormalized from users.city for direct town-page lookups
    province             VARCHAR(120),        -- denormalized from users.province, same reason
    hourly_rate_zar     NUMERIC(10,2),
    years_active        INTEGER,
    sars_registered     BOOLEAN NOT NULL DEFAULT FALSE,
    copyright_registered BOOLEAN NOT NULL DEFAULT FALSE,
    reputation_score    NUMERIC(3,2) NOT NULL DEFAULT 0.00, -- 0.00 - 5.00, fed by sentiment analysis
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- organizers — event organizer / venue profile data
-- ---------------------------------------------------------------------
CREATE TABLE organizers (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    organization_name   VARCHAR(255) NOT NULL,
    organizer_type      VARCHAR(32) CHECK (organizer_type IN ('venue', 'promoter', 'brand', 'individual')),
    verified            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- portfolios — artist portfolio items (posts / media / work samples)
-- ---------------------------------------------------------------------
CREATE TABLE portfolios (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id           UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    title               VARCHAR(255),
    caption             TEXT,
    media_url           TEXT,
    media_type          VARCHAR(16) CHECK (media_type IN ('image', 'video', 'audio')),
    is_public           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- events — gigs/events posted by organizers
-- ---------------------------------------------------------------------
CREATE TABLE events (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id        UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
    title               VARCHAR(255) NOT NULL,
    event_type          VARCHAR(32) CHECK (event_type IN
                          ('concert', 'theatrical_performance', 'stand_up_comedy', 'open_mic', 'other')),
    category            VARCHAR(32) CHECK (category IN
                          ('music', 'media', 'drama', 'poetry', 'dance', 'art', 'other')),
    genre               VARCHAR(64),
    city                VARCHAR(120) NOT NULL,
    province             VARCHAR(120) NOT NULL,
    venue_name          VARCHAR(255),
    budget_zar          NUMERIC(10,2),
    event_date          DATE NOT NULL,
    description         TEXT,
    status              VARCHAR(16) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'booked', 'completed', 'cancelled')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- bookings — an artist accepted onto an event
-- ---------------------------------------------------------------------
CREATE TABLE bookings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id            UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    artist_id           UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    organizer_id        UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
    agreed_fee_zar      NUMERIC(10,2) NOT NULL,
    status              VARCHAR(24) NOT NULL DEFAULT 'pending' CHECK (status IN
                          ('pending', 'confirmed', 'completed', 'cancelled', 'disputed')),
    booked_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at        TIMESTAMPTZ
);

-- ---------------------------------------------------------------------
-- contracts — AI-generated contract per booking, with risk score
-- ---------------------------------------------------------------------
CREATE TABLE contracts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id          UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    contract_text        TEXT NOT NULL,
    risk_score          NUMERIC(3,2), -- 0.00 (low risk) - 1.00 (high risk), from AI Contract Generator
    risk_flags          TEXT[],       -- e.g. {'missing cancellation clause'}
    artist_signed_at     TIMESTAMPTZ,
    organizer_signed_at  TIMESTAMPTZ,
    status              VARCHAR(16) NOT NULL DEFAULT 'draft' CHECK (status IN
                          ('draft', 'sent', 'signed', 'voided')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- payments — escrow ledger, one or more milestones per booking
-- ---------------------------------------------------------------------
CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id          UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount_zar          NUMERIC(10,2) NOT NULL,
    commission_zar      NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_gateway     VARCHAR(32) CHECK (payment_gateway IN ('payfast', 'ozow', 'yoco', 'stripe')),
    status              VARCHAR(24) NOT NULL DEFAULT 'held_in_escrow' CHECK (status IN
                          ('pending', 'held_in_escrow', 'released', 'refunded', 'failed')),
    held_at             TIMESTAMPTZ,
    released_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- reviews — post-event feedback, sentiment-scored, feeds reputation
-- ---------------------------------------------------------------------
CREATE TABLE reviews (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id          UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    reviewer_user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating              SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment             TEXT,
    sentiment_score     NUMERIC(3,2), -- -1.00 (negative) to 1.00 (positive), from Sentiment Analysis
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- tax_estimates — AI Tax Assistant output per artist per period
-- ---------------------------------------------------------------------
CREATE TABLE tax_estimates (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id           UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,
    gross_income_zar    NUMERIC(10,2) NOT NULL DEFAULT 0,
    estimated_expenses_zar NUMERIC(10,2) NOT NULL DEFAULT 0,
    estimated_tax_zar   NUMERIC(10,2) NOT NULL DEFAULT 0,
    sars_filing_due     DATE,
    generated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_artists_category ON artists(category);
CREATE INDEX idx_artists_town ON artists(town);
CREATE INDEX idx_events_city ON events(city);
CREATE INDEX idx_events_province ON events(province);
CREATE INDEX idx_bookings_artist ON bookings(artist_id);
CREATE INDEX idx_bookings_organizer ON bookings(organizer_id);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_reviews_booking ON reviews(booking_id);
CREATE INDEX idx_tax_estimates_artist ON tax_estimates(artist_id);
