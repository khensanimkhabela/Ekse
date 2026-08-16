"""
AI Tax Assistant + Expense Tracking (SARS-aware).

Production design: a time-series/regression model forecasting income from
platform payment history, plus a SARS-aware provisional-tax estimator and
auto-categorization of income/expenses pulled from platform transactions,
with filing-season reminders driven off SARS deadlines.

STUB: this module applies a simplified, illustrative South African
provisional-tax bracket calculation locally. It is NOT tax advice — a real
implementation would call/consult SARS-published tables and a trained
expense-categorization model.
"""
from __future__ import annotations

from pydantic import BaseModel

# Simplified illustrative brackets (stub only — not real SARS tax tables).
_BRACKETS = [
    (237_100, 0.18, 0),
    (370_500, 0.26, 42_678),
    (512_800, 0.31, 77_362),
    (673_000, 0.36, 121_475),
    (857_900, 0.39, 179_147),
    (float("inf"), 0.41, 251_258),
]


class TaxEstimateRequest(BaseModel):
    artist_id: str | None = None
    gross_income_zar: float
    expenses_zar: float = 0
    period_start: str
    period_end: str


class TaxEstimateResponse(BaseModel):
    taxable_income_zar: float
    estimated_tax_zar: float
    effective_rate_pct: float
    sars_filing_due: str
    categorized_expenses: dict[str, float]
    note: str


def estimate_tax(req: TaxEstimateRequest) -> TaxEstimateResponse:
    """STUB: mocked provisional-tax estimate using simplified brackets, plus
    a rule-based expense categorizer standing in for a trained classifier."""
    taxable = max(req.gross_income_zar - req.expenses_zar, 0)

    tax = 0.0
    lower = 0
    for upper, rate, base in _BRACKETS:
        if taxable > lower:
            band = min(taxable, upper) - lower
            tax = base + (taxable - lower) * rate if taxable <= upper else tax
        if taxable <= upper:
            break
        lower = upper

    effective_rate = (tax / taxable * 100) if taxable else 0.0

    # Rule-based expense categorization stub (real version: NLP classifier
    # over transaction descriptions from the payments ledger).
    categorized = {
        "equipment_and_gear": round(req.expenses_zar * 0.35, 2),
        "travel_and_transport": round(req.expenses_zar * 0.25, 2),
        "marketing_and_promotion": round(req.expenses_zar * 0.15, 2),
        "venue_and_studio_hire": round(req.expenses_zar * 0.15, 2),
        "other": round(req.expenses_zar * 0.10, 2),
    }

    return TaxEstimateResponse(
        taxable_income_zar=round(taxable, 2),
        estimated_tax_zar=round(tax, 2),
        effective_rate_pct=round(effective_rate, 2),
        sars_filing_due="2027-01-31",  # provisional tax period 2 due date, illustrative
        categorized_expenses=categorized,
        note="Illustrative estimate only (stub brackets) — not SARS-filed tax advice.",
    )
