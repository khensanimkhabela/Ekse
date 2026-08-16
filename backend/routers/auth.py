"""
Authentication — registration (artist or organizer) and login. Issues a
bearer JWT on both, so signup logs the user straight in.
"""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from auth import create_access_token, hash_password, verify_password
from db import get_db
from deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


def _auth_user_out(db: Session, user: models.User) -> schemas.AuthUserOut:
    artist = db.query(models.Artist).filter(models.Artist.user_id == user.id).first()
    organizer = db.query(models.Organizer).filter(models.Organizer.user_id == user.id).first()
    return schemas.AuthUserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        artist_id=artist.id if artist else None,
        organizer_id=organizer.id if organizer else None,
    )


@router.post("/register", response_model=schemas.TokenResponse, status_code=201)
def register(payload: schemas.RegisterRequest, db: Session = Depends(get_db)) -> schemas.TokenResponse:
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    if payload.role == "artist" and not payload.stage_name:
        raise HTTPException(status_code=422, detail="stage_name is required for artist accounts")
    if payload.role == "organizer" and not payload.organization_name:
        raise HTTPException(status_code=422, detail="organization_name is required for organizer accounts")

    now = datetime.now(timezone.utc).isoformat()
    user = models.User(
        id=str(uuid.uuid4()),
        email=payload.email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role=payload.role,
        full_name=payload.full_name,
        city=payload.city,
        province=payload.province,
        created_at=now,
        updated_at=now,
    )
    db.add(user)
    db.flush()  # assign user.id to the FK rows below within the same transaction

    if payload.role == "artist":
        db.add(
            models.Artist(
                id=str(uuid.uuid4()),
                user_id=user.id,
                stage_name=payload.stage_name,
                category=payload.category or "other",
                genres=payload.genres,
                bio=payload.bio,
                reputation_score=0,
                created_at=now,
                updated_at=now,
            )
        )
    else:
        db.add(
            models.Organizer(
                id=str(uuid.uuid4()),
                user_id=user.id,
                organization_name=payload.organization_name,
                organizer_type=payload.organizer_type,
                verified=False,
                created_at=now,
                updated_at=now,
            )
        )

    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, {"role": user.role})
    return schemas.TokenResponse(access_token=token, user=_auth_user_out(db, user))


@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)) -> schemas.TokenResponse:
    user = db.query(models.User).filter(models.User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token(user.id, {"role": user.role})
    return schemas.TokenResponse(access_token=token, user=_auth_user_out(db, user))


@router.get("/me", response_model=schemas.AuthUserOut)
def me(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> schemas.AuthUserOut:
    return _auth_user_out(db, user)
