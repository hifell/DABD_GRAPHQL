import os
from dotenv import load_dotenv

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base

# Load .env saat development lokal
load_dotenv()

# Ambil environment variable
DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-key-untuk-lokal")

print("DATABASE_URL =", DATABASE_URL)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Use SQLite for local development if DATABASE_URL is not set or contains 'localhost'
if not DATABASE_URL or 'localhost' in DATABASE_URL.lower():
    DATABASE_URL = "sqlite:///./kerjole.db"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    # Validasi DATABASE_URL
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL tidak ditemukan di environment variables")

    # Paksa menggunakan driver psycopg v3
    if DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace(
            "postgresql://",
            "postgresql+psycopg://",
            1
        )

    elif DATABASE_URL.startswith("postgresql+psycopg2://"):
        DATABASE_URL = DATABASE_URL.replace(
            "postgresql+psycopg2://",
            "postgresql+psycopg://",
            1
        )

    # Hapus parameter pgbouncer=true jika ada
    DATABASE_URL = DATABASE_URL.replace("?pgbouncer=true", "")
    DATABASE_URL = DATABASE_URL.replace("&pgbouncer=true", "")

    # SQLAlchemy Engine
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
    )

# Session Factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base Model
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()