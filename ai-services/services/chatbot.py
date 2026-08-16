"""
AI Chat Assistant — answers questions about bookings, the featured
"Artist of the Week", and events happening near the user. This is the
conversational front-end to Smart Artist Discovery's multilingual NLP
search/chat requirement (English, isiZulu, isiXhosa, Afrikaans, Sesotho).

Split in two, mirroring the rest of ai-services:
  1. classify_intent — mocked NLP intent classification + language
     detection on the raw user message. The backend (which owns the data)
     branches on the returned intent to fetch bookings/events/the featured
     artist, then calls...
  2. compose_reply — mocked natural-language generation, weaving the
     backend's structured data into a conversational reply.

STUB: both are rule-based/templated here, standing in for a real
multilingual transformer (intent/NER) + LLM (reply generation) pipeline.
"""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

Intent = Literal["bookings", "artist_of_week", "events_near_me", "general"]

_INTENT_KEYWORDS: dict[Intent, list[str]] = {
    "bookings": [
        "booking", "bookings", "gig", "gigs", "booked", "my events", "contract", "payment", "paid",
        "ibhukingi", "boeking",  # isiZulu / Afrikaans
    ],
    "artist_of_week": [
        "artist of the week", "featured artist", "who's hot", "whos hot", "trending artist",
        "top artist", "best artist", "umculi",  # isiZulu: "the artist"
    ],
    "events_near_me": [
        "events near me", "near me", "nearby", "what's on", "whats on", "happening near",
        "events in my area", "local events", "imicimbi",  # isiZulu: "events"
    ],
}

_LANGUAGE_HINTS = {
    "zu": ["ibhukingi", "umculi", "imicimbi", "ngicela", "sawubona"],
    "xh": ["umculi", "iziganeko", "molo"],
    "af": ["boeking", "kunsenaar", "geleenthede", "hallo"],
    "st": ["dipapadi", "moqapi", "dumela"],
}


class ClassifyRequest(BaseModel):
    message: str


class ClassifyResponse(BaseModel):
    intent: Intent
    detected_language: str
    confidence: float


def classify_intent(req: ClassifyRequest) -> ClassifyResponse:
    """STUB: keyword-based intent + language detection standing in for a
    fine-tuned multilingual intent classifier."""
    text = req.message.lower()

    detected_language = "en"
    for lang, hints in _LANGUAGE_HINTS.items():
        if any(hint in text for hint in hints):
            detected_language = lang
            break

    best_intent: Intent = "general"
    best_score = 0
    for intent, keywords in _INTENT_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text)
        if score > best_score:
            best_score = score
            best_intent = intent

    confidence = 0.5 if best_intent == "general" else min(0.6 + 0.15 * best_score, 0.97)
    return ClassifyResponse(intent=best_intent, detected_language=detected_language, confidence=round(confidence, 2))


class ComposeRequest(BaseModel):
    intent: Intent
    user_name: str
    data: dict = {}


class ComposeResponse(BaseModel):
    reply: str


def compose_reply(req: ComposeRequest) -> ComposeResponse:
    """STUB: templated natural-language composition standing in for an
    LLM call grounded in the structured data the backend already fetched."""
    data = req.data
    first_name = req.user_name.split(" ")[0] if req.user_name else "there"

    if req.intent == "bookings":
        bookings = data.get("bookings", [])
        if not bookings:
            reply = f"Hey {first_name}, you don't have any bookings yet — check Explore to find events to play or artists to book."
        else:
            confirmed = sum(1 for b in bookings if b.get("status") in ("confirmed", "completed"))
            pending = sum(1 for b in bookings if b.get("status") == "pending")
            reply = (
                f"You have {len(bookings)} booking(s), {first_name}: {confirmed} confirmed/completed"
                f"{f' and {pending} pending' if pending else ''}. "
                f"The most recent is worth R{bookings[0]['agreed_fee_zar']:,.2f}, status \"{bookings[0]['status']}\"."
            )

    elif req.intent == "artist_of_week":
        artist = data.get("artist")
        if not artist:
            reply = "I couldn't find an Artist of the Week right now — check back soon."
        else:
            reply = (
                f"🌟 This week's Artist of the Week is {artist['stage_name']} "
                f"({artist['category']}{', ' + artist['genres'] if artist.get('genres') else ''}) "
                f"from {artist.get('town', 'South Africa')}, rated {artist['reputation_score']:.1f}/5 by organizers. "
                f"{artist.get('bio', '')}"
            )

    elif req.intent == "events_near_me":
        events = data.get("events", [])
        location = data.get("location", "your area")
        if not events:
            reply = f"No events found near {location} right now — check back soon or try a nearby town."
        else:
            names = ", ".join(e["title"] for e in events[:3])
            reply = f"Found {len(events)} event(s) near {location}: {names}."
            if len(events) > 3:
                reply += f" +{len(events) - 3} more."

    else:
        reply = (
            f"Hi {first_name}! I can help with your bookings, this week's featured artist, "
            "or events happening near you — just ask."
        )

    return ComposeResponse(reply=reply)
