from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from db import get_db
from deps import get_current_user
from services import ai_client

router = APIRouter(prefix="/contracts", tags=["contracts"])


@router.get("", response_model=list[schemas.ContractOut])
def list_contracts(db: Session = Depends(get_db)) -> list[models.Contract]:
    return db.query(models.Contract).all()


@router.post("/draft", response_model=schemas.ContractDraftOut)
def draft_contract(
    payload: schemas.ContractDraftRequest,
    user: models.User = Depends(get_current_user),
) -> schemas.ContractDraftOut:
    """Standalone contract drafting for the Profile > Protect Your Work
    screen — same AI Contract Generator the real booking flow uses
    (routers/bookings.py), just without an actual booking behind it, so an
    artist can draft/preview a contract before (or without) taking a
    booking through the platform. Declared before /{contract_id} so
    "draft" isn't swallowed as a path param."""
    result = ai_client.generate_contract(
        artist_name=payload.artist_name,
        organizer_name=payload.organizer_name,
        event_title=payload.event_title,
        event_date=payload.event_date,
        fee_zar=payload.fee_zar,
        city=payload.city or "",
    )
    return schemas.ContractDraftOut(**result)


@router.get("/{contract_id}", response_model=schemas.ContractOut)
def get_contract(contract_id: str, db: Session = Depends(get_db)) -> models.Contract:
    contract = db.get(models.Contract, contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract
