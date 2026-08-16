"""
Bookings — creating a booking follows the workflow described in the master
prompt's "AI ARCHITECTURE" section: organizer books artist -> AI Contract
Generator drafts + risk-scores a contract. See services/ai_client.py.
"""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from db import get_db
from services import ai_client

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.get("", response_model=list[schemas.BookingOut])
def list_bookings(
    artist_id: str | None = None,
    organizer_id: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
) -> list[models.Booking]:
    q = db.query(models.Booking)
    if artist_id:
        q = q.filter(models.Booking.artist_id == artist_id)
    if organizer_id:
        q = q.filter(models.Booking.organizer_id == organizer_id)
    if status:
        q = q.filter(models.Booking.status == status)
    return q.all()


@router.get("/{booking_id}", response_model=schemas.BookingOut)
def get_booking(booking_id: str, db: Session = Depends(get_db)) -> models.Booking:
    booking = db.get(models.Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.post("", response_model=schemas.BookingWithContractOut, status_code=201)
def create_booking(payload: schemas.BookingCreate, db: Session = Depends(get_db)) -> schemas.BookingWithContractOut:
    event = db.get(models.Event, payload.event_id)
    artist = db.get(models.Artist, payload.artist_id)
    organizer = db.get(models.Organizer, payload.organizer_id)
    if not event or not artist or not organizer:
        raise HTTPException(status_code=404, detail="event_id, artist_id or organizer_id not found")

    now = datetime.now(timezone.utc).isoformat()
    booking = models.Booking(
        id=str(uuid.uuid4()),
        event_id=payload.event_id,
        artist_id=payload.artist_id,
        organizer_id=payload.organizer_id,
        agreed_fee_zar=payload.agreed_fee_zar,
        status="confirmed",
        booked_at=now,
    )
    db.add(booking)
    event.status = "booked"

    # AI Contract Generator + Risk Scoring (see services/ai_client.py)
    ai_result = ai_client.generate_contract(
        artist_name=artist.stage_name,
        organizer_name=organizer.organization_name,
        event_title=event.title,
        event_date=event.event_date,
        fee_zar=payload.agreed_fee_zar,
        city=event.city,
    )
    contract = models.Contract(
        id=str(uuid.uuid4()),
        booking_id=booking.id,
        contract_text=ai_result["contract_text"],
        risk_score=ai_result["risk_score"],
        risk_flags=", ".join(ai_result.get("risk_flags", [])),
        status="draft",
        created_at=now,
    )
    db.add(contract)

    # Escrow payment placeholder — held until milestone confirmation
    payment = models.Payment(
        id=str(uuid.uuid4()),
        booking_id=booking.id,
        amount_zar=payload.agreed_fee_zar,
        commission_zar=round(payload.agreed_fee_zar * 0.15, 2),
        payment_gateway="payfast",
        status="held_in_escrow",
        held_at=now,
        created_at=now,
    )
    db.add(payment)

    db.commit()
    db.refresh(booking)
    db.refresh(contract)
    return schemas.BookingWithContractOut(booking=booking, contract=contract)
