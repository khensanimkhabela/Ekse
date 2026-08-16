"""Shared FastAPI dependencies."""
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

import models
from auth import decode_access_token
from db import get_db

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    """Resolves the bearer JWT to a users row, or 401s. Use as a route
    dependency wherever an endpoint needs to know who's asking (see
    routers/auth.py's /me and routers/chat.py)."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        claims = decode_access_token(credentials.credentials)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.get(models.User, claims["sub"])
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user
