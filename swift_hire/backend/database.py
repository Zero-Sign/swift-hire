### database.py
import os
from dotenv import load_dotenv

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load environment variables
load_dotenv()

# Read DATABASE_URL from environment or default to PostgreSQL local URL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    os.getenv("DB_URL", "postgresql://postgres:12345@localhost:5432/swift_hire")
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all database tables"""
    from models import Base
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")


if __name__ == "__main__":
    create_tables()
