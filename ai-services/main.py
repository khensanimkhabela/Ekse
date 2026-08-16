"""
Fimiya AI Services — Python microservice hosting the 5 AI features described
in the master build prompt's "AI ARCHITECTURE" section, plus a 6th — the AI
Chat Assistant (bookings / Artist of the Week / events near me) built on top
of Smart Artist Discovery's multilingual chat requirement. Every model call
in here is currently a clearly-marked STUB (see each services/*.py module
docstring) so the API contract is real and callable before real models are
wired in.

Run:
    uvicorn main:app --reload --port 8001
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services import chatbot, contracts, discovery, sentiment_fraud, tax, visibility

app = FastAPI(
    title="Fimiya AI Services",
    description="Stubbed AI microservice: discovery, contracts, tax, visibility, sentiment/fraud, chat assistant.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # demo only — restrict in production
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "ai-services"}


# --- 1. Smart Artist Discovery ---------------------------------------------
@app.post("/discovery/match", response_model=discovery.MatchResponse)
def discovery_match(req: discovery.MatchRequest) -> discovery.MatchResponse:
    return discovery.match_artists(req)


# --- 2. AI Contract Generator + Risk Scoring --------------------------------
@app.post("/contracts/generate", response_model=contracts.ContractResponse)
def contracts_generate(req: contracts.ContractRequest) -> contracts.ContractResponse:
    return contracts.generate_contract(req)


# --- 3. AI Tax Assistant + Expense Tracking ---------------------------------
@app.post("/tax/estimate", response_model=tax.TaxEstimateResponse)
def tax_estimate(req: tax.TaxEstimateRequest) -> tax.TaxEstimateResponse:
    return tax.estimate_tax(req)


# --- 4. AI Visibility Engine -------------------------------------------------
@app.post("/visibility/bio", response_model=visibility.BioResponse)
def visibility_bio(req: visibility.BioRequest) -> visibility.BioResponse:
    return visibility.generate_bio(req)


@app.post("/visibility/caption", response_model=visibility.CaptionResponse)
def visibility_caption(req: visibility.CaptionRequest) -> visibility.CaptionResponse:
    return visibility.generate_caption(req)


@app.post("/visibility/poster", response_model=visibility.PosterResponse)
def visibility_poster(req: visibility.PosterRequest) -> visibility.PosterResponse:
    return visibility.generate_poster(req)


# --- 5. Sentiment Analysis + Fraud Detection ---------------------------------
@app.post("/sentiment/analyze", response_model=sentiment_fraud.SentimentResponse)
def sentiment_analyze(req: sentiment_fraud.SentimentRequest) -> sentiment_fraud.SentimentResponse:
    return sentiment_fraud.analyze_sentiment(req)


@app.post("/fraud/check", response_model=sentiment_fraud.FraudCheckResponse)
def fraud_check(req: sentiment_fraud.FraudCheckRequest) -> sentiment_fraud.FraudCheckResponse:
    return sentiment_fraud.check_fraud(req)


# --- 6. AI Chat Assistant (bookings / Artist of the Week / events near me) --
@app.post("/chat/classify", response_model=chatbot.ClassifyResponse)
def chat_classify(req: chatbot.ClassifyRequest) -> chatbot.ClassifyResponse:
    return chatbot.classify_intent(req)


@app.post("/chat/compose", response_model=chatbot.ComposeResponse)
def chat_compose(req: chatbot.ComposeRequest) -> chatbot.ComposeResponse:
    return chatbot.compose_reply(req)
