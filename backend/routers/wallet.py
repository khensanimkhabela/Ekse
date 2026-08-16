"""
Wallet — an artist's earnings dashboard: what's been paid out, what's still
held in escrow, and what SARS will want, all computed from the real
payments ledger (not mocked numbers). The tax figure is the AI Tax
Assistant (services/ai_client.py -> ai-services), fed the artist's actual
earnings — the same "backend owns the data, ai-services owns the AI part"
split as the booking flow and the chat assistant.
"""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from db import get_db
from deps import get_current_user
from services import ai_client

router = APIRouter(prefix="/wallet", tags=["wallet"])

_RELEASED = "released"
_OUTSTANDING = ("held_in_escrow", "pending")

# Simplified assumption: with no expense line-items tracked yet, estimate
# deductible expenses as a flat 20% of gross earnings — a common rule-of-thumb
# for a working artist (equipment, travel, marketing). Swap for real tracked
# expenses once that exists.
ASSUMED_EXPENSE_RATIO = 0.2


def _tax_period() -> tuple[str, str]:
    """SARS provisional tax period: 1 March - end of February. Returns the
    current period's start/end as ISO dates."""
    today = date.today()
    start_year = today.year if today.month >= 3 else today.year - 1
    period_start = date(start_year, 3, 1)
    period_end = today
    return period_start.isoformat(), period_end.isoformat()


@router.get("", response_model=schemas.WalletOut)
def get_wallet(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)) -> schemas.WalletOut:
    artist = db.query(models.Artist).filter(models.Artist.user_id == user.id).first()
    if not artist:
        raise HTTPException(status_code=404, detail="Wallet is only available for artist accounts")

    rows = (
        db.query(models.Payment, models.Event)
        .join(models.Booking, models.Payment.booking_id == models.Booking.id)
        .join(models.Event, models.Booking.event_id == models.Event.id)
        .filter(models.Booking.artist_id == artist.id)
        .order_by(models.Payment.created_at.desc())
        .all()
    )

    earned = 0.0
    pending = 0.0
    completed_bookings = 0
    pending_bookings = 0
    transactions: list[schemas.WalletTransaction] = []

    for payment, event in rows:
        net = payment.amount_zar - payment.commission_zar
        if payment.status == _RELEASED:
            earned += net
            completed_bookings += 1
        elif payment.status in _OUTSTANDING:
            pending += net
            pending_bookings += 1

        transactions.append(
            schemas.WalletTransaction(
                id=payment.id,
                event_title=event.title,
                amount_zar=round(net, 2),
                gross_zar=payment.amount_zar,
                commission_zar=payment.commission_zar,
                status=payment.status,
                date=payment.released_at or payment.held_at or payment.created_at,
            )
        )

    period_start, period_end = _tax_period()
    tax = ai_client.estimate_tax(
        gross_income_zar=round(earned, 2),
        expenses_zar=round(earned * ASSUMED_EXPENSE_RATIO, 2),
        period_start=period_start,
        period_end=period_end,
    )

    return schemas.WalletOut(
        earned_zar=round(earned, 2),
        pending_zar=round(pending, 2),
        total_revenue_zar=round(earned + pending, 2),
        estimated_tax_zar=tax["estimated_tax_zar"],
        taxable_income_zar=tax["taxable_income_zar"],
        effective_tax_rate_pct=tax["effective_rate_pct"],
        sars_filing_due=tax["sars_filing_due"],
        completed_bookings=completed_bookings,
        pending_bookings=pending_bookings,
        transactions=transactions[:10],
    )
