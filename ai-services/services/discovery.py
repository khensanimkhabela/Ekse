"""
Smart Artist Discovery — recommendation engine + multilingual NLP search.

Production design (see README "AI ARCHITECTURE"): two-tower neural retrieval
or graph-based collaborative filtering over the artist <-> organizer <->
event graph, with a multilingual transformer (XLM-R / AfriBERTa family) for
free-text query understanding across English, isiZulu, isiXhosa, Afrikaans
and Sesotho.

STUB: this module returns deterministic, rule-based mock results so the API
contract is real and callable before any model is trained/wired in. No
network or model calls happen here.
"""
from __future__ import annotations

from pydantic import BaseModel

# Small in-memory catalogue standing in for the artist index a real
# retrieval model would search over.
_MOCK_ARTISTS = [
    {"stage_name": "Zee_Water", "category": "music", "genres": ["Jazz", "Kwaito"], "city": "Durban", "province": "KwaZulu-Natal"},
    {"stage_name": "MC Vusi", "category": "music", "genres": ["Hip-Hop", "House"], "city": "Johannesburg", "province": "Gauteng"},
    {"stage_name": "Naledi Poetics", "category": "poetry", "genres": ["Spoken Word"], "city": "Pretoria", "province": "Gauteng"},
    {"stage_name": "Kaylee", "category": "poetry", "genres": ["Spoken Word", "Storytelling"], "city": "Cape Town", "province": "Western Cape"},
    {"stage_name": "Sipho Strings", "category": "music", "genres": ["Maskandi", "Classical"], "city": "Durban", "province": "KwaZulu-Natal"},
    {"stage_name": "The Cape Flats Collective", "category": "dance", "genres": ["Contemporary", "Gumboot"], "city": "Cape Town", "province": "Western Cape"},
    {"stage_name": "Reggae Rebels", "category": "music", "genres": ["Reggae"], "city": "Durban", "province": "KwaZulu-Natal"},
    {"stage_name": "Drama Circle JHB", "category": "drama", "genres": ["Theatre", "Comedy"], "city": "Johannesburg", "province": "Gauteng"},
]

SUPPORTED_LANGUAGES = ["en", "zu", "xh", "af", "st"]


class MatchRequest(BaseModel):
    query: str = ""
    category: str | None = None
    city: str | None = None
    province: str | None = None
    budget_zar: float | None = None
    language: str = "en"


class MatchResult(BaseModel):
    stage_name: str
    category: str
    genres: list[str]
    city: str
    province: str
    match_score: float


class MatchResponse(BaseModel):
    detected_language: str
    results: list[MatchResult]


def match_artists(req: MatchRequest) -> MatchResponse:
    """STUB: mocked ranking. A real implementation would embed `req.query`
    with a multilingual encoder and do nearest-neighbour retrieval against
    an artist embedding index, then re-rank by budget/availability."""
    query_terms = req.query.lower().split()
    scored = []
    for artist in _MOCK_ARTISTS:
        score = 0.5  # base relevance floor, mimics a retrieval model's prior
        if req.category and artist["category"] == req.category:
            score += 0.25
        if req.city and artist["city"] == req.city:
            score += 0.15
        if req.province and artist["province"] == req.province:
            score += 0.05
        if any(term in artist["stage_name"].lower() or any(term in g.lower() for g in artist["genres"]) for term in query_terms):
            score += 0.2
        scored.append((min(score, 0.99), artist))

    scored.sort(key=lambda pair: pair[0], reverse=True)
    results = [
        MatchResult(match_score=round(score, 2), **artist)
        for score, artist in scored[:5]
    ]
    lang = req.language if req.language in SUPPORTED_LANGUAGES else "en"
    return MatchResponse(detected_language=lang, results=results)
