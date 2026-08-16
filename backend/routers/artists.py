from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

import models
import schemas
from db import get_db

router = APIRouter(prefix="/artists", tags=["artists"])


def get_artist_of_the_week(db: Session) -> models.Artist | None:
    """Deterministic weekly rotation among the top-rated artists — not
    random, and not always just #1, so the "of the week" framing holds up
    (same pick all week, changes next week) without needing a dedicated
    featured-artist table for the demo."""
    top_rated = db.query(models.Artist).order_by(models.Artist.reputation_score.desc()).limit(5).all()
    if not top_rated:
        return None
    week_number = date.today().isocalendar()[1]
    return top_rated[week_number % len(top_rated)]


@router.get("", response_model=list[schemas.ArtistOut])
def list_artists(
    category: str | None = None,
    town: str | None = None,
    province: str | None = None,
    genre: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
) -> list[models.Artist]:
    query = db.query(models.Artist)
    if category:
        query = query.filter(models.Artist.category == category)
    if town:
        query = query.filter(models.Artist.town == town)
    if province:
        query = query.filter(models.Artist.province == province)
    if genre:
        # genres is a comma-separated string column — case-insensitive substring match.
        query = query.filter(func.lower(models.Artist.genres).contains(genre.lower()))
    if search:
        # Powers the top-nav search bar — matches stage name, genres, bio,
        # town or category so a search for e.g. "jazz" or "Durban" or an
        # artist's name all work from the same box.
        term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                func.lower(models.Artist.stage_name).like(term),
                func.lower(models.Artist.genres).like(term),
                func.lower(models.Artist.bio).like(term),
                func.lower(models.Artist.town).like(term),
                func.lower(models.Artist.category).like(term),
            )
        )
    return query.all()


@router.get("/featured", response_model=schemas.ArtistOut)
def featured_artist(db: Session = Depends(get_db)) -> models.Artist:
    """Artist of the Week — see get_artist_of_the_week(). Declared before
    /{artist_id} so "featured" isn't swallowed as a path param."""
    artist = get_artist_of_the_week(db)
    if not artist:
        raise HTTPException(status_code=404, detail="No artists yet")
    return artist


@router.get("/{artist_id}", response_model=schemas.ArtistOut)
def get_artist(artist_id: str, db: Session = Depends(get_db)) -> models.Artist:
    artist = db.get(models.Artist, artist_id)
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    return artist
