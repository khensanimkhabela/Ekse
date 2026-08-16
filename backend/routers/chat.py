"""
AI Chat Assistant — answers questions about the signed-in user's bookings,
this week's featured artist, and events happening near them. Orchestration
lives here (this router owns the DB queries); the actual "AI" — intent
classification and reply composition — is delegated to ai-services (see
services/ai_client.py's classify_chat_intent/compose_chat_reply), mirroring
how the booking flow delegates contract generation.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
import schemas
from db import get_db
from deps import get_current_user
from routers.artists import get_artist_of_the_week
from services import ai_client

router = APIRouter(prefix="/chat", tags=["chat"])


def _artist_to_dict(artist: models.Artist) -> dict:
    return {
        "stage_name": artist.stage_name,
        "category": artist.category,
        "genres": artist.genres,
        "town": artist.town,
        "bio": artist.bio,
        "reputation_score": artist.reputation_score,
    }


def _booking_to_dict(booking: models.Booking) -> dict:
    return {
        "id": booking.id,
        "status": booking.status,
        "agreed_fee_zar": booking.agreed_fee_zar,
        "booked_at": booking.booked_at,
    }


def _event_to_dict(event: models.Event) -> dict:
    return {"id": event.id, "title": event.title, "city": event.city, "event_date": event.event_date}


@router.post("", response_model=schemas.ChatResponse)
def chat(
    payload: schemas.ChatRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> schemas.ChatResponse:
    classification = ai_client.classify_chat_intent(payload.message)
    intent = classification["intent"]
    data: dict = {}

    if intent == "bookings":
        artist = db.query(models.Artist).filter(models.Artist.user_id == user.id).first()
        organizer = db.query(models.Organizer).filter(models.Organizer.user_id == user.id).first()
        q = db.query(models.Booking)
        if artist:
            q = q.filter(models.Booking.artist_id == artist.id)
        elif organizer:
            q = q.filter(models.Booking.organizer_id == organizer.id)
        else:
            q = q.filter(False)  # no artist/organizer profile -> no bookings possible
        bookings = q.order_by(models.Booking.booked_at.desc()).all()
        data["bookings"] = [_booking_to_dict(b) for b in bookings]

    elif intent == "artist_of_week":
        artist = get_artist_of_the_week(db)
        data["artist"] = _artist_to_dict(artist) if artist else None

    elif intent == "events_near_me":
        location = user.city or user.province or "your area"
        q = db.query(models.Event).filter(models.Event.status == "open")
        if user.city:
            q = q.filter(models.Event.city == user.city)
        elif user.province:
            q = q.filter(models.Event.province == user.province)
        events = q.all()
        data["events"] = [_event_to_dict(e) for e in events]
        data["location"] = location

    reply = ai_client.compose_chat_reply(intent, user.full_name, data)

    return schemas.ChatResponse(
        reply=reply,
        intent=intent,
        detected_language=classification.get("detected_language", "en"),
        data=data,
    )
