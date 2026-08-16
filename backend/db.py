"""
Database wiring for the Fimiya backend.

Dev/demo default: the SQLite file built by db/create_demo_db.py
(backend/db/fimiya_demo.db). In production, set DATABASE_URL to a
PostgreSQL DSN matching db/schema.sql (e.g.
postgresql+psycopg2://user:pass@host:5432/fimiya) — see infra/docker-compose.yml.
"""
import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DEFAULT_SQLITE_PATH = Path(__file__).resolve().parent / "db" / "fimiya_demo.db"
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DEFAULT_SQLITE_PATH}")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
