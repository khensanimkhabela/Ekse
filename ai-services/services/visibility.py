"""
AI Visibility Engine — bios, captions and event posters.

Production design: text generation (LLM) for bios/captions tuned per
platform (Instagram, TikTok, Facebook, WhatsApp Status), and a diffusion
model (Stable Diffusion) for event poster/flyer generation.

STUB: this module returns templated text and a placeholder poster
reference — no LLM or diffusion model call is made.
"""
from __future__ import annotations

from pydantic import BaseModel

_PLATFORM_STYLE = {
    "instagram": "punchy, emoji-forward, 1-2 short lines + hashtags",
    "tiktok": "hook-first, casual, trend-aware, under 150 characters",
    "facebook": "warm, slightly longer, community-oriented",
    "whatsapp_status": "very short, direct, 1 line",
}


class BioRequest(BaseModel):
    stage_name: str
    category: str
    genres: list[str] = []
    highlights: str = ""


class BioResponse(BaseModel):
    bio: str


class CaptionRequest(BaseModel):
    stage_name: str
    topic: str
    platform: str = "instagram"


class CaptionResponse(BaseModel):
    platform: str
    caption: str


class PosterRequest(BaseModel):
    event_title: str
    event_date: str
    city: str
    artist_names: list[str] = []


class PosterResponse(BaseModel):
    poster_prompt: str
    poster_url: str


def generate_bio(req: BioRequest) -> BioResponse:
    """STUB: templated bio generation standing in for an LLM call."""
    genre_str = ", ".join(req.genres) if req.genres else req.category
    highlight = f" {req.highlights}." if req.highlights else ""
    bio = (
        f"{req.stage_name} is a South African {req.category} artist working in {genre_str}."
        f"{highlight} Booking now on Fimiya — Ekse, Shine Yakithi."
    )
    return BioResponse(bio=bio)


def generate_caption(req: CaptionRequest) -> CaptionResponse:
    """STUB: templated, platform-tuned caption standing in for an LLM call."""
    style = _PLATFORM_STYLE.get(req.platform, _PLATFORM_STYLE["instagram"])
    caption = f"{req.stage_name} — {req.topic} ✨🎤 #Ekse #ShineYakithi"
    if req.platform == "whatsapp_status":
        caption = f"{req.stage_name}: {req.topic} 🎤"
    return CaptionResponse(platform=req.platform, caption=f"{caption}  [{style}]")


def generate_poster(req: PosterRequest) -> PosterResponse:
    """STUB: returns the prompt that would be sent to a diffusion model and
    a placeholder image reference, standing in for a real Stable Diffusion
    call."""
    lineup = ", ".join(req.artist_names) if req.artist_names else "TBA lineup"
    prompt = (
        f"Bold, rounded, high-energy event poster for '{req.event_title}' in {req.city} on "
        f"{req.event_date}, featuring {lineup}. Brand palette: indigo blue #5271FF, lime green "
        "#8BF65D, white. Poppins-style display type."
    )
    return PosterResponse(poster_prompt=prompt, poster_url="/mock-assets/poster-placeholder.png")
