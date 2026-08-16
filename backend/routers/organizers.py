from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from db import get_db

router = APIRouter(prefix="/organizers", tags=["organizers"])


@router.get("", response_model=list[schemas.OrganizerOut])
def list_organizers(db: Session = Depends(get_db)) -> list[models.Organizer]:
    return db.query(models.Organizer).all()


@router.get("/{organizer_id}", response_model=schemas.OrganizerOut)
def get_organizer(organizer_id: str, db: Session = Depends(get_db)) -> models.Organizer:
    organizer = db.get(models.Organizer, organizer_id)
    if not organizer:
        raise HTTPException(status_code=404, detail="Organizer not found")
    return organizer
