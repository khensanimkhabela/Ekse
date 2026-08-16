"""
Sentiment Analysis + Fraud Detection.

Production design: a fine-tuned classifier scoring review/feedback
sentiment (feeds the artist's reputation_score) and an anomaly-detection
model over the booking/payment transaction graph to catch fake organizers,
chargeback abuse and other anomalous patterns.

STUB: sentiment uses a small positive/negative keyword lexicon; fraud
detection uses simple rule-based heuristics. No trained model is called.
"""
from __future__ import annotations

from pydantic import BaseModel

_POSITIVE_WORDS = {"great", "amazing", "incredible", "love", "best", "professional", "again", "thank"}
_NEGATIVE_WORDS = {"late", "cancelled", "rude", "unpaid", "scam", "never", "worst", "bad", "no-show"}


class SentimentRequest(BaseModel):
    text: str


class SentimentResponse(BaseModel):
    sentiment_score: float  # -1.00 (negative) to 1.00 (positive)
    label: str


def analyze_sentiment(req: SentimentRequest) -> SentimentResponse:
    """STUB: lexicon-based scoring standing in for a fine-tuned classifier."""
    words = {w.strip(".,!?").lower() for w in req.text.split()}
    pos = len(words & _POSITIVE_WORDS)
    neg = len(words & _NEGATIVE_WORDS)
    total = pos + neg
    score = 0.0 if total == 0 else round((pos - neg) / total, 2)
    label = "positive" if score > 0.15 else "negative" if score < -0.15 else "neutral"
    return SentimentResponse(sentiment_score=score, label=label)


class FraudCheckRequest(BaseModel):
    organizer_account_age_days: int
    booking_count_last_24h: int
    payment_amount_zar: float
    payment_method_country: str = "ZA"


class FraudCheckResponse(BaseModel):
    risk_score: float  # 0.00 (low) - 1.00 (high)
    flags: list[str]
    recommendation: str


def check_fraud(req: FraudCheckRequest) -> FraudCheckResponse:
    """STUB: rule-based heuristics standing in for anomaly detection over
    the transaction graph."""
    flags: list[str] = []
    risk = 0.05

    if req.organizer_account_age_days < 2:
        flags.append("Organizer account created less than 48 hours ago")
        risk += 0.35
    if req.booking_count_last_24h > 5:
        flags.append("Unusually high booking velocity in the last 24 hours")
        risk += 0.25
    if req.payment_amount_zar > 50_000:
        flags.append("Payment amount well above typical booking size")
        risk += 0.15
    if req.payment_method_country != "ZA":
        flags.append("Payment method country differs from platform region")
        risk += 0.1

    risk = round(min(risk, 0.99), 2)
    recommendation = "hold_for_manual_review" if risk >= 0.5 else "proceed"
    return FraudCheckResponse(risk_score=risk, flags=flags, recommendation=recommendation)
