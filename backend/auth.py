"""
Password hashing + JWT issuance for the Fimiya backend.

Demo-scope note: SECRET_KEY defaults to an insecure dev value below —
override it via the SECRET_KEY env var for anything beyond local demo use
(see infra/.env.example). Tokens carry no refresh mechanism and are stored
client-side in localStorage (see frontend/lib/auth.ts) rather than an
httpOnly cookie — fine for this demo, worth hardening before a real
production deployment.
"""
import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-insecure-secret-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24h


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        # Seed/demo rows may carry a placeholder, non-bcrypt hash — treat as no match.
        return False


def create_access_token(subject: str, extra_claims: dict) -> str:
    payload = {
        "sub": subject,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        **extra_claims,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
