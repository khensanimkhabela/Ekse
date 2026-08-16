from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from db import get_db

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("", response_model=list[schemas.PaymentOut])
def list_payments(db: Session = Depends(get_db)) -> list[models.Payment]:
    return db.query(models.Payment).all()


@router.get("/{payment_id}", response_model=schemas.PaymentOut)
def get_payment(payment_id: str, db: Session = Depends(get_db)) -> models.Payment:
    payment = db.get(models.Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment


@router.post("/{payment_id}/release", response_model=schemas.PaymentOut)
def release_payment(payment_id: str, db: Session = Depends(get_db)) -> models.Payment:
    """Milestone confirmed -> payout released (minus commission), per the
    AI ARCHITECTURE workflow diagram."""
    payment = db.get(models.Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    if payment.status == "released":
        raise HTTPException(status_code=400, detail="Payment already released")
    payment.status = "released"
    payment.released_at = datetime.now(timezone.utc).isoformat()
    db.commit()
    db.refresh(payment)
    return payment
