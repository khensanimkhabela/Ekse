from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from db import get_db

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[schemas.EventOut])
def list_events(
    province: str | None = None,
    city: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
) -> list[models.Event]:
    q = db.query(models.Event)
    if province:
        q = q.filter(models.Event.province == province)
    if city:
        q = q.filter(models.Event.city == city)
    if category:
        q = q.filter(models.Event.category == category)
    return q.all()


@router.get("/{event_id}", response_model=schemas.EventOut)
def get_event(event_id: str, db: Session = Depends(get_db)) -> models.Event:
    event = db.get(models.Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event
